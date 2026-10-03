import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async createHold(data: { showId: string; seatIds: string[]; userId: string }) {
    const { showId, seatIds, userId } = data;

    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestException("At least one seat must be selected");
    }

    const show = await this.prisma.show.findUnique({
      where: { id: showId },
      include: { showPrices: true },
    });

    if (!show) {
      throw new NotFoundException(`Show with ID ${showId} not found`);
    }

    const holdDurationMinutes = 10;
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);
    const holdToken = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const bookingNumber = `BMS-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.$transaction(async (tx) => {
      const showSeats = await tx.showSeat.findMany({
        where: {
          showId,
          seatId: { in: seatIds },
        },
        include: { seat: true },
      });

      if (showSeats.length !== seatIds.length) {
        throw new BadRequestException("One or more selected seats do not exist for this show");
      }

      const now = new Date();
      for (const ss of showSeats) {
        if (ss.status === "BOOKED") {
          throw new ConflictException(`Seat ${ss.seat?.seatNumber || ss.seatId} is already booked`);
        }
        if (ss.status === "HELD" && ss.heldUntil && ss.heldUntil > now && ss.heldBy !== userId) {
          throw new ConflictException(`Seat ${ss.seat?.seatNumber || ss.seatId} is currently held by another user`);
        }
      }

      let subtotal = 0;
      const seatPriceMap = new Map<string, number>();

      for (const ss of showSeats) {
        const tier = ss.seat?.tier || "Silver";
        const tierPrice =
          show.showPrices.find((p) => p.tier.toLowerCase() === tier.toLowerCase())?.price || 250;
        seatPriceMap.set(ss.id, tierPrice);
        subtotal += tierPrice;
      }

      const convenienceFee = Math.round(subtotal * 0.05);
      const taxAmount = Math.round((subtotal + convenienceFee) * 0.18);
      const totalAmount = subtotal + convenienceFee + taxAmount;

      await tx.showSeat.updateMany({
        where: {
          id: { in: showSeats.map((s) => s.id) },
        },
        data: {
          status: "HELD",
          holdToken,
          heldBy: userId,
          heldUntil: expiresAt,
        },
      });

      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          userId,
          showId,
          status: "PENDING",
          subtotal,
          convenienceFee,
          taxAmount,
          totalAmount,
          currency: "INR",
          expiresAt,
          idempotencyKey: holdToken,
          bookingSeats: {
            create: showSeats.map((ss) => ({
              showSeatId: ss.id,
              seatPrice: seatPriceMap.get(ss.id) || 250,
            })),
          },
        },
        include: {
          bookingSeats: {
            include: {
              showSeat: {
                include: { seat: true },
              },
            },
          },
          show: {
            include: {
              movie: true,
              screen: {
                include: { theater: true },
              },
            },
          },
        },
      });

      return {
        message: "Seats held successfully for 10 minutes",
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        holdToken,
        expiresAt,
        totalAmount,
        booking,
      };
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        bookingSeats: {
          include: {
            showSeat: {
              include: { seat: true },
            },
          },
        },
        show: {
          include: {
            movie: true,
            screen: {
              include: { theater: true },
            },
          },
        },
        payment: true,
        tickets: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async getUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: { theater: true },
            },
          },
        },
        tickets: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
