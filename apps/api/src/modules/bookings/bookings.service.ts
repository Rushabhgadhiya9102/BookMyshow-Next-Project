import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SeatLockService } from "./seat-lock.service";
import { CancellationPolicyService } from "./cancellation-policy.service";
import { PricingService } from "../pricing/pricing.service";
import { SeatsGateway } from "../seats/seats.gateway";
import { MetricsService } from "../metrics/metrics.service";
import { EventsService } from "../events/events.service";

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private prisma: PrismaService,
    private seatLockService: SeatLockService,
    private seatsGateway: SeatsGateway,
    private pricingService: PricingService,
    private cancellationPolicyService: CancellationPolicyService,
    private metricsService: MetricsService,
    private eventsService: EventsService
  ) {}

  /**
   * Sweeps expired holds and safely releases seats back to AVAILABLE
   * with ownership verification (Section 34 & 35).
   */
  async cleanExpiredHolds(showId?: string): Promise<number> {
    const now = new Date();

    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
        ...(showId ? { showId } : {}),
      },
      include: { bookingSeats: true },
    });

    if (expiredBookings.length === 0) return 0;

    let releasedCount = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const booking of expiredBookings) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "EXPIRED" },
        });

        const showSeatIds = booking.bookingSeats.map((b) => b.showSeatId);
        if (showSeatIds.length > 0) {
          // Section 35: Safe Expiration - only release if heldBy and holdToken match
          const res = await tx.showSeat.updateMany({
            where: {
              id: { in: showSeatIds },
              status: "HELD",
              holdToken: booking.idempotencyKey,
              heldBy: booking.userId,
            },
            data: {
              status: "AVAILABLE",
              holdToken: null,
              heldBy: null,
              heldUntil: null,
            },
          });
          releasedCount += res.count;
          if (res.count > 0) {
            this.seatsGateway.broadcastSeatReleased(booking.showId, showSeatIds);
          }
        }
      }
    });

    if (releasedCount > 0) {
      this.metricsService.increment("booking.expired", releasedCount);
      this.logger.log(
        `Safely released ${releasedCount} expired seat holds with ownership verification (Section 35).`
      );
    }

    return releasedCount;
  }

  /**
   * Creates an atomic seat hold (Section 28-33).
   * 1. Acquires coordination lock on all seats.
   * 2. Opens database transaction.
   * 3. Verifies all requested seats are AVAILABLE.
   * 4. Calculates exact server pricing from ShowPrice tiers.
   * 5. Creates PENDING booking and immutable BookingSeat price snapshots.
   * 6. Updates ShowSeat status to HELD with 10-minute TTL.
   * 7. Releases coordination locks.
   */
  async createHold(data: {
    showId: string;
    seatIds: string[];
    userId: string;
    idempotencyKey?: string;
  }) {
    const { showId, seatIds, userId, idempotencyKey } = data;

    if (!seatIds || seatIds.length === 0) {
      throw new BadRequestException("At least one seat must be selected");
    }

    // Section 79: Idempotent hold lookup
    if (idempotencyKey) {
      const existingHold = await this.prisma.booking.findFirst({
        where: {
          userId,
          idempotencyKey,
          status: "PENDING",
          expiresAt: { gt: new Date() },
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

      if (existingHold) {
        this.logger.log(`Idempotent hold matched for key: ${idempotencyKey}`);
        return {
          message: "Existing active seat hold returned idempotently",
          bookingId: existingHold.id,
          bookingNumber: existingHold.bookingNumber,
          holdToken: existingHold.idempotencyKey,
          expiresAt: existingHold.expiresAt,
          totalAmount: existingHold.totalAmount,
          booking: existingHold,
        };
      }
    }

    const show = await this.prisma.show.findUnique({
      where: { id: showId },
      include: { showPrices: true },
    });

    if (!show) {
      throw new NotFoundException(`Show with ID ${showId} not found`);
    }

    // Clean expired holds for this show first
    await this.cleanExpiredHolds(showId);

    const holdDurationMinutes = 10;
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);
    const holdToken = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const bookingNumber = `BMS-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const result = await this.seatLockService.withLocks(
        showId,
        seatIds,
        30,
        async () => {
          return this.prisma.$transaction(async (tx) => {
            const showSeats = await tx.showSeat.findMany({
              where: {
                showId,
                seatId: { in: seatIds },
              },
              include: { seat: true },
            });

            if (showSeats.length !== seatIds.length) {
              throw new BadRequestException(
                "One or more selected seats do not exist for this show"
              );
            }

            const now = new Date();
            for (const ss of showSeats) {
              if (ss.status === "BOOKED") {
                throw new ConflictException(
                  `Seat ${ss.seat?.seatNumber || ss.seatId} is already booked`
                );
              }
              if (
                ss.status === "HELD" &&
                ss.heldUntil &&
                ss.heldUntil > now &&
                ss.heldBy !== userId
              ) {
                throw new ConflictException(
                  `Seat ${ss.seat?.seatNumber || ss.seatId} is currently held by another user`
                );
              }
            }

            // Section 123: Authoritative Pricing Engine calculation
            const pricing = await this.pricingService.calculatePrice({
              showId,
              seatIds,
            });

            const seatPriceMap = new Map<string, number>();
            for (const s of pricing.seats) {
              seatPriceMap.set(s.showSeatId, s.priceRupees);
            }

            const subtotal = pricing.subtotalRupees;
            const convenienceFee = pricing.convenienceFeeRupees;
            const taxAmount = pricing.convenienceTaxRupees;
            const totalAmount = pricing.totalRupees;

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
                discountAmount: 0,
                convenienceFee,
                taxAmount,
                totalAmount,
                currency: "INR",
                expiresAt,
                idempotencyKey: idempotencyKey || holdToken,
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
      );

      // Section 82 & 83: Broadcast SEAT_HELD event to room show:{showId}
      this.seatsGateway.broadcastSeatHeld(showId, seatIds, expiresAt);
      this.metricsService.increment("booking.hold.success");

      return result;
    } catch (err: any) {
      this.metricsService.increment("booking.hold.conflict");
      if (err.message === "COULD_NOT_ACQUIRE_LOCK") {
        throw new ConflictException(
          "One or more selected seats are currently being locked by another concurrent booking request. Please try again."
        );
      }
      throw err;
    }
  }

  /**
   * Releases an active seat hold manually (e.g. user canceled checkout or changed seats).
   */
  async releaseHold(bookingId: string, userId?: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingSeats: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (userId && booking.userId !== userId) {
      throw new BadRequestException("Unauthorized to release this booking hold");
    }

    if (booking.status !== "PENDING") {
      return { message: `Booking is already ${booking.status}` };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });

      const showSeatIds = booking.bookingSeats.map((bs) => bs.showSeatId);
      if (showSeatIds.length > 0) {
        await tx.showSeat.updateMany({
          where: {
            id: { in: showSeatIds },
            status: "HELD",
            holdToken: booking.idempotencyKey,
            heldBy: booking.userId,
          },
          data: {
            status: "AVAILABLE",
            holdToken: null,
            heldBy: null,
            heldUntil: null,
          },
        });
      }
    });

    const releasedSeatIds = booking.bookingSeats.map((bs) => bs.showSeatId);
    if (releasedSeatIds.length > 0) {
      this.seatsGateway.broadcastSeatReleased(booking.showId, releasedSeatIds);
    }

    return { message: "Hold released and seats returned to AVAILABLE successfully" };
  }

  /**
   * Processes a refund for an eligible booking (Section 20 & 24).
   */
  async requestRefund(data: {
    bookingId: string;
    reason?: string;
    userId?: string;
  }) {
    const { bookingId, reason, userId } = data;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        tickets: true,
        bookingSeats: true,
        show: true,
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (userId && booking.userId !== userId) {
      throw new BadRequestException("Unauthorized to request refund for this booking");
    }

    if (booking.status !== "CONFIRMED") {
      throw new BadRequestException(
        `Only CONFIRMED bookings can be refunded. Current status is ${booking.status}`
      );
    }

    // Section 125 & 126: Policy-Driven Cancellation & Refund Flow
    const policyResult = this.cancellationPolicyService.evaluate(
      booking.show.startTime,
      booking.totalAmount
    );

    const refundAmount = policyResult.refundAmount;
    const providerRefundId = `ref_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const fullReason = reason
      ? `${reason} [${policyResult.reason}]`
      : policyResult.reason;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Refund record
      const refund = await tx.refund.create({
        data: {
          bookingId: booking.id,
          paymentId: booking.payment?.id || booking.id,
          providerRefundId,
          amount: refundAmount,
          currency: booking.currency || "INR",
          status: "SUCCEEDED",
          reason: fullReason,
          completedAt: new Date(),
        },
      });

      // 2. Mark Booking as REFUNDED
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "REFUNDED" },
      });

      // 3. Mark Payment as REFUNDED
      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: "REFUNDED" },
        });
      }

      // 4. Mark Tickets as CANCELLED
      await tx.ticket.updateMany({
        where: { bookingId: booking.id },
        data: { status: "CANCELLED" },
      });

      // 5. Release seats back to AVAILABLE
      const showSeatIds = booking.bookingSeats.map((b) => b.showSeatId);
      if (showSeatIds.length > 0) {
        await tx.showSeat.updateMany({
          where: { id: { in: showSeatIds } },
          data: {
            status: "AVAILABLE",
            holdToken: null,
            heldBy: null,
            heldUntil: null,
          },
        });
        this.seatsGateway.broadcastSeatReleased(booking.showId, showSeatIds);
      }

      return {
        message: "Refund processed successfully and seats released",
        refund,
        refundAmount,
        cancellationFee: policyResult.cancellationFee,
        refundPercentage: policyResult.refundPercentage,
        policyTier: policyResult.policyTier,
        bookingId: booking.id,
      };
    });

    // Section 127: Non-blocking asynchronous event emission
    this.eventsService.emitAsync("REFUND_PROCESSED", {
      booking,
      refund: result.refund,
      userEmail: booking.user?.email,
    });

    return result;
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
        refunds: true,
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
        refunds: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
