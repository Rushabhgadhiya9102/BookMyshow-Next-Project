import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export interface SupportLookupResult {
  bookingId: string;
  bookingNumber: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    username: string;
  };
  show: {
    id: string;
    startTime: Date;
    endTime: Date;
    movie: {
      id: string;
      title: string;
      posterUrl?: string | null;
    };
    theater: {
      name: string;
      screen: string;
      address?: string | null;
    };
  };
  seats: Array<{
    seatNumber: string;
    tier: string;
    price: number;
  }>;
  pricing: {
    subtotal: number;
    convenienceFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    currency: string;
  };
  payment: {
    id: string;
    status: string;
    providerPaymentId?: string | null;
    amount: number;
    method?: string | null;
  } | null;
  tickets: Array<{
    id: string;
    ticketNumber: string;
    status: string;
    validationCode?: string | null;
    isUsed: boolean;
    usedAt?: Date | null;
  }>;
  refunds: Array<{
    id: string;
    amount: number;
    status: string;
    reason?: string | null;
    createdAt: Date;
  }>;
  timeline: Array<{
    event: string;
    timestamp: Date | string;
    details?: string;
  }>;
}

@Injectable()
export class SupportLookupService {
  private readonly logger = new Logger(SupportLookupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Section 139: Multi-attribute unified support & audit lookup.
   * Matches across booking number, email, Stripe payment reference, or ticket number.
   */
  async search(query: string): Promise<{ query: string; totalMatches: number; results: SupportLookupResult[] }> {
    const term = (query || "").trim();
    if (!term) {
      return { query: "", totalMatches: 0, results: [] };
    }

    // Parallel searches across possible matching dimensions
    const [byBookingNumber, byEmail, byPaymentId, byTicketNumber] = await Promise.all([
      // 1. By Booking Number or ID
      this.prisma.booking.findMany({
        where: {
          OR: [
            { bookingNumber: { contains: term, mode: "insensitive" } },
            { id: term },
          ],
        },
        include: this.bookingIncludes(),
        take: 10,
      }),

      // 2. By Customer Email
      this.prisma.booking.findMany({
        where: {
          user: {
            email: { contains: term, mode: "insensitive" },
          },
        },
        include: this.bookingIncludes(),
        take: 10,
        orderBy: { createdAt: "desc" },
      }),

      // 3. By Payment Provider ID or internal Payment ID
      this.prisma.booking.findMany({
        where: {
          payment: {
            OR: [
              { id: term },
              { providerPaymentId: { contains: term, mode: "insensitive" } },
            ],
          },
        },
        include: this.bookingIncludes(),
        take: 10,
      }),

      // 4. By Ticket Number or Ticket ID
      this.prisma.booking.findMany({
        where: {
          tickets: {
            some: {
              OR: [
                { id: term },
                { ticketNumber: { contains: term, mode: "insensitive" } },
                { qrCodePayload: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
        include: this.bookingIncludes(),
        take: 10,
      }),
    ]);

    // De-duplicate matched bookings by ID
    const mergedMap = new Map<string, any>();
    for (const b of [
      ...byBookingNumber,
      ...byEmail,
      ...byPaymentId,
      ...byTicketNumber,
    ]) {
      mergedMap.set(b.id, b);
    }

    const results: SupportLookupResult[] = Array.from(mergedMap.values()).map(
      (b) => {
        // Construct chronological timeline
        const timeline: SupportLookupResult["timeline"] = [
          { event: "BOOKING_CREATED", timestamp: b.createdAt },
        ];

        if (b.payment?.createdAt) {
          timeline.push({
            event: `PAYMENT_${b.payment.status}`,
            timestamp: b.payment.createdAt,
            details: `₹${b.payment.amount} via ${b.payment.paymentMethod || "Stripe"}`,
          });
        }

        if (b.status === "CONFIRMED") {
          timeline.push({
            event: "BOOKING_CONFIRMED",
            timestamp: b.updatedAt,
          });
        }

        for (const t of b.tickets) {
          timeline.push({
            event: `TICKET_${t.status}`,
            timestamp: t.createdAt,
            details: `#${t.ticketNumber}`,
          });
          if (t.isUsed && t.usedAt) {
            timeline.push({
              event: "TICKET_CONSUMED_AT_GATE",
              timestamp: t.usedAt,
              details: `#${t.ticketNumber} validated`,
            });
          }
        }

        for (const r of b.refunds) {
          timeline.push({
            event: `REFUND_${r.status}`,
            timestamp: r.createdAt,
            details: `₹${r.amount} (${r.reason || "Customer refund"})`,
          });
        }

        // Sort timeline chronologically
        timeline.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        return {
          bookingId: b.id,
          bookingNumber: b.bookingNumber,
          status: b.status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          user: {
            id: b.user.id,
            email: b.user.email,
            username: b.user.username,
          },
          show: {
            id: b.show.id,
            startTime: b.show.startTime,
            endTime: b.show.endTime,
            movie: {
              id: b.show.movie.id,
              title: b.show.movie.title,
              posterUrl: b.show.movie.posterUrl,
            },
            theater: {
              name: b.show.screen.theater.name,
              screen: b.show.screen.name,
              address: b.show.screen.theater.address,
            },
          },
          seats: b.bookingSeats.map((bs: any) => ({
            seatNumber: bs.showSeat.seat.seatNumber,
            tier: bs.showSeat.seat.tier,
            price: bs.seatPrice,
          })),
          pricing: {
            subtotal: b.subtotal,
            convenienceFee: b.convenienceFee,
            taxAmount: b.taxAmount,
            discountAmount: b.discountAmount,
            totalAmount: b.totalAmount,
            currency: b.currency,
          },
          payment: b.payment
            ? {
                id: b.payment.id,
                status: b.payment.status,
                providerPaymentId: b.payment.providerPaymentId,
                amount: b.payment.amount,
                method: b.payment.paymentMethod,
              }
            : null,
          tickets: b.tickets.map((t: any) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            status: t.status,
            validationCode: t.validationCode,
            isUsed: t.isUsed,
            usedAt: t.usedAt,
          })),
          refunds: b.refunds.map((r: any) => ({
            id: r.id,
            amount: r.amount,
            status: r.status,
            reason: r.reason,
            createdAt: r.createdAt,
          })),
          timeline,
        };
      }
    );

    return {
      query: term,
      totalMatches: results.length,
      results,
    };
  }

  private bookingIncludes() {
    return {
      user: true,
      show: {
        include: {
          movie: true,
          screen: {
            include: {
              theater: true,
            },
          },
        },
      },
      bookingSeats: {
        include: {
          showSeat: {
            include: {
              seat: true,
            },
          },
        },
      },
      payment: true,
      tickets: true,
      refunds: true,
    };
  }
}
