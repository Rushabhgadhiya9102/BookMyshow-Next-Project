import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CalculatePriceDto,
  PricingBreakdown,
  SeatPriceItem,
} from "./pricing.dto";

// Predefined verified coupons (Section 124)
export interface CouponDefinition {
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number; // Percentage (e.g. 20) or flat amount in paise (e.g. 10000 = ₹100)
  minSpendPaise: number;
  maxDiscountPaise?: number;
  description: string;
  isActive: boolean;
}

const COUPONS_REGISTRY: Record<string, CouponDefinition> = {
  WELCOME50: {
    code: "WELCOME50",
    discountType: "PERCENTAGE",
    discountValue: 50,
    minSpendPaise: 20000, // ₹200 min
    maxDiscountPaise: 15000, // ₹150 max cap
    description: "50% off up to ₹150 on your first booking",
    isActive: true,
  },
  MOVIE20: {
    code: "MOVIE20",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minSpendPaise: 30000, // ₹300 min
    maxDiscountPaise: 20000, // ₹200 max cap
    description: "20% off up to ₹200 on all movies",
    isActive: true,
  },
  FLAT100: {
    code: "FLAT100",
    discountType: "FLAT",
    discountValue: 10000, // ₹100 in paise
    minSpendPaise: 40000, // ₹400 min
    description: "Flat ₹100 discount on bookings above ₹400",
    isActive: true,
  },
};

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  // Constants strictly in integer minor units (Section 123)
  private readonly CONVENIENCE_FEE_PAISE_PER_SEAT = 3000; // ₹30.00
  private readonly GST_RATE = 0.18; // 18% GST on convenience fee

  constructor(private prisma: PrismaService) {}

  /**
   * Section 123: Authoritative server-side pricing engine.
   * Calculations strictly avoid floating-point math by utilizing integer minor units (paise).
   */
  async calculatePrice(dto: CalculatePriceDto): Promise<PricingBreakdown> {
    const { showId, seatIds, couponCode } = dto;

    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestException("At least one seat must be selected");
    }

    const show = await this.prisma.show.findUnique({
      where: { id: showId },
      include: {
        showPrices: true,
        showSeats: {
          where: {
            OR: [
              { id: { in: seatIds } },
              { seatId: { in: seatIds } },
            ],
          },
          include: { seat: true },
        },
      },
    });

    if (!show) {
      throw new NotFoundException(`Show with ID ${showId} not found`);
    }

    if (show.showSeats.length !== seatIds.length) {
      throw new BadRequestException(
        `Requested ${seatIds.length} seats, but only found ${show.showSeats.length} valid seats for this show`
      );
    }

    // Map prices by tier
    const tierPriceMap = new Map<string, number>();
    for (const p of show.showPrices) {
      // Store in integer paise
      tierPriceMap.set(p.tier.toUpperCase(), Math.round(p.price * 100));
    }

    // Calculate seat item prices in integer paise
    const seats: SeatPriceItem[] = [];
    let subtotalPaise = 0;

    for (const showSeat of show.showSeats) {
      const tierKey = (showSeat.seat.tier || "REGULAR").toUpperCase();
      // Default fallback if tier price missing: ₹200 = 20000 paise
      const pricePaise = tierPriceMap.get(tierKey) || 20000;

      subtotalPaise += pricePaise;

      seats.push({
        showSeatId: showSeat.id,
        seatId: showSeat.seatId,
        seatNumber: showSeat.seat.seatNumber,
        tier: showSeat.seat.tier || "REGULAR",
        pricePaise,
        priceRupees: pricePaise / 100,
      });
    }

    // Section 124: Coupon validation & discount calculation
    let discountPaise = 0;
    let appliedCoupon: PricingBreakdown["appliedCoupon"] = undefined;

    if (couponCode) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const coupon = COUPONS_REGISTRY[normalizedCode];

      if (!coupon || !coupon.isActive) {
        throw new BadRequestException(`Invalid or expired coupon code: ${couponCode}`);
      }

      if (subtotalPaise < coupon.minSpendPaise) {
        throw new BadRequestException(
          `Coupon ${coupon.code} requires a minimum ticket subtotal of ₹${coupon.minSpendPaise / 100}`
        );
      }

      if (coupon.discountType === "PERCENTAGE") {
        const rawDiscount = Math.round((subtotalPaise * coupon.discountValue) / 100);
        discountPaise = coupon.maxDiscountPaise
          ? Math.min(rawDiscount, coupon.maxDiscountPaise)
          : rawDiscount;
      } else {
        discountPaise = Math.min(coupon.discountValue, subtotalPaise);
      }

      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      };
    }

    // Taxable ticket amount
    const taxablePaise = Math.max(0, subtotalPaise - discountPaise);

    // Convenience fee & GST in integer paise
    const seatCount = seats.length;
    const convenienceFeePaise = seatCount * this.CONVENIENCE_FEE_PAISE_PER_SEAT;
    const convenienceTaxPaise = Math.round(convenienceFeePaise * this.GST_RATE);

    // Final total
    const totalPaise = taxablePaise + convenienceFeePaise + convenienceTaxPaise;

    return {
      seats,
      seatCount,
      subtotalPaise,
      subtotalRupees: subtotalPaise / 100,
      discountPaise,
      discountRupees: discountPaise / 100,
      taxablePaise,
      taxableRupees: taxablePaise / 100,
      convenienceFeePaise,
      convenienceFeeRupees: convenienceFeePaise / 100,
      convenienceTaxPaise,
      convenienceTaxRupees: convenienceTaxPaise / 100,
      totalPaise,
      totalRupees: totalPaise / 100,
      currency: "INR",
      appliedCoupon,
    };
  }

  /**
   * Helper for integer unit arithmetic
   */
  toPaise(rupees: number): number {
    return Math.round(rupees * 100);
  }

  toRupees(paise: number): number {
    return paise / 100;
  }
}
