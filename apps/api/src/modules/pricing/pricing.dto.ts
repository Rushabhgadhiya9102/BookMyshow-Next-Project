import { IsString, IsArray, IsOptional } from "class-validator";

export class CalculatePriceDto {
  @IsString()
  showId!: string;

  @IsArray()
  @IsString({ each: true })
  seatIds!: string[];

  @IsOptional()
  @IsString()
  couponCode?: string;
}

export interface SeatPriceItem {
  showSeatId: string;
  seatId: string;
  seatNumber: string;
  tier: string;
  pricePaise: number;
  priceRupees: number;
}

export interface PricingBreakdown {
  seats: SeatPriceItem[];
  seatCount: number;
  subtotalPaise: number;
  subtotalRupees: number;
  discountPaise: number;
  discountRupees: number;
  taxablePaise: number;
  taxableRupees: number;
  convenienceFeePaise: number;
  convenienceFeeRupees: number;
  convenienceTaxPaise: number;
  convenienceTaxRupees: number;
  totalPaise: number;
  totalRupees: number;
  currency: string;
  appliedCoupon?: {
    code: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    description: string;
  };
}
