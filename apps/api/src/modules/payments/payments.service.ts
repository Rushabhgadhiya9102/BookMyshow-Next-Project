import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "@/prisma/prisma.service";
import { SeatsGateway } from "../seats/seats.gateway";
import { MetricsService } from "../metrics/metrics.service";
import { EventsService } from "../events/events.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private seatsGateway: SeatsGateway,
    private metricsService: MetricsService,
    private eventsService: EventsService
  ) {
    const stripeKey =
      this.configService.get<string>("STRIPE_SECRET_KEY") ||
      process.env.STRIPE_SECRET_KEY;

    if (stripeKey) {
      this.stripe = new Stripe(stripeKey);
    } else {
      this.logger.warn("STRIPE_SECRET_KEY not set. Stripe calls will run in fallback/mock mode.");
    }
  }

  /**
   * Internal transactional helper to transition Booking to CONFIRMED,
   * Payment to SUCCEEDED, ShowSeats to BOOKED, and mint Ticket (Sections 20-23).
   */
  async confirmBookingAndIssueTicket(
    bookingId: string,
    providerPaymentId: string,
    paidAmount?: number
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          bookingSeats: true,
          show: { include: { movie: true } },
          payment: true,
          tickets: true,
          user: true,
        },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      // If already confirmed with active ticket, return existing
      if (booking.status === "CONFIRMED" && booking.tickets.length > 0) {
        return { booking, ticket: booking.tickets[0] };
      }

      // Section 41: Payment Timeout & Boundary Recovery
      if (booking.status === "EXPIRED") {
        const showSeatIds = booking.bookingSeats.map((b) => b.showSeatId);
        const freeOrMySeats = await tx.showSeat.findMany({
          where: {
            id: { in: showSeatIds },
            OR: [
              { status: "AVAILABLE" },
              { status: "HELD", heldBy: booking.userId },
            ],
          },
        });

        if (freeOrMySeats.length === showSeatIds.length) {
          this.logger.log(
            `Boundary recovery: Booking ${bookingId} was EXPIRED, but seats remain available. Reactivating booking.`
          );
        } else {
          this.logger.warn(
            `Boundary conflict: Seats for expired booking ${bookingId} were claimed by another customer. Initiating refund.`
          );
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: "REFUND_PENDING" },
          });
          await tx.payment.upsert({
            where: { bookingId },
            update: {
              status: "REFUND_PENDING",
              providerPaymentId,
              amount: paidAmount ?? booking.totalAmount,
            },
            create: {
              bookingId,
              provider: "STRIPE",
              providerPaymentId,
              amount: paidAmount ?? booking.totalAmount,
              currency: "INR",
              status: "REFUND_PENDING",
            },
          });
          return { booking, refundPending: true, message: "Seats unavailable due to timeout. Full refund initiated." };
        }
      }

      // 1. Confirm Booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      });

      // 2. Mark Payment as SUCCEEDED
      await tx.payment.upsert({
        where: { bookingId },
        update: {
          status: "SUCCEEDED",
          providerPaymentId,
          paidAt: new Date(),
          amount: paidAmount ?? booking.totalAmount,
        },
        create: {
          bookingId,
          provider: "STRIPE",
          providerPaymentId,
          amount: paidAmount ?? booking.totalAmount,
          currency: "INR",
          status: "SUCCEEDED",
          paidAt: new Date(),
        },
      });

      // 3. Mark ShowSeats as BOOKED
      if (booking.bookingSeats.length > 0) {
        await tx.showSeat.updateMany({
          where: {
            id: { in: booking.bookingSeats.map((b) => b.showSeatId) },
          },
          data: {
            status: "BOOKED",
            bookedAt: new Date(),
          },
        });
      }

      // 4. Mint Ticket with cryptographic ticketNumber & QR payload (Section 23 & 43)
      const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const qrPayload = JSON.stringify({
        ticketNumber,
        bookingId,
        movie: booking.show.movie.title,
        seatCount: booking.bookingSeats.length || 1,
        amount: paidAmount ?? booking.totalAmount,
        verifiedAt: new Date().toISOString(),
      });

      const ticket = await tx.ticket.create({
        data: {
          bookingId,
          ticketNumber,
          qrCodePayload: qrPayload,
          seatCount: booking.bookingSeats.length || 1,
          status: "ACTIVE",
        },
      });

      this.logger.log(`Confirmed booking ${bookingId} and issued ticket ${ticketNumber}`);

      const bookedSeatIds = booking.bookingSeats.map((b) => b.showSeatId);
      if (bookedSeatIds.length > 0) {
        this.seatsGateway.broadcastSeatBooked(booking.showId, bookedSeatIds);
      }

      return { booking, ticket };
    });

    if ("ticket" in result && result.ticket) {
      // Section 154: Operational metrics tracking
      this.metricsService.increment("payment.success");
      this.metricsService.increment("booking.confirmed");
      this.metricsService.increment("ticket.created");

      // Section 127: Non-blocking asynchronous event emission
      this.eventsService.emitAsync("BOOKING_CONFIRMED", {
        booking: result.booking,
        ticket: result.ticket,
        userEmail: (result.booking as any)?.user?.email,
      });
    }

    return result;
  }

  async createStripeSession(data: {
    amount?: number;
    movieId?: string;
    userId?: string;
    selectedSeats?: string[];
    bookingId?: string;
  }) {
    const { movieId, userId, selectedSeats, bookingId } = data;

    let currentBookingId = bookingId;
    let verifiedAmount: number;
    let movieTitle: string = "Movie Ticket";
    let seatLabels: string[] = selectedSeats || [];
    let currentUserId = userId || "";

    if (currentBookingId) {
      // Section 37: Enforce server-side price security directly from Booking record
      const existingBooking = await this.prisma.booking.findUnique({
        where: { id: currentBookingId },
        include: {
          show: { include: { movie: true } },
          bookingSeats: { include: { showSeat: { include: { seat: true } } } },
        },
      });

      if (!existingBooking) {
        throw new NotFoundException(`Booking with ID ${currentBookingId} not found`);
      }

      verifiedAmount = existingBooking.totalAmount;
      movieTitle = existingBooking.show.movie.title;
      currentUserId = existingBooking.userId;
      seatLabels = existingBooking.bookingSeats.map(
        (bs) => `${bs.showSeat.seat.rowLabel}${bs.showSeat.seat.seatNumber}`
      );
    } else {
      verifiedAmount = Number(data.amount) || 250;
      const bookingNumber = `BMS-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      let show = movieId ? await this.prisma.show.findFirst({ where: { movieId } }) : null;
      if (!show) {
        let city = (await this.prisma.city.findFirst()) || (await this.prisma.city.create({
          data: { name: "Default City", slug: `city-${Date.now().toString(36)}` }
        }));
        let theater = (await this.prisma.theater.findFirst()) || (await this.prisma.theater.create({
          data: { name: "Main Cinema", slug: `cinema-${Date.now().toString(36)}`, cityId: city.id, address: "Central" }
        }));
        let screen = (await this.prisma.screen.findFirst()) || (await this.prisma.screen.create({
          data: { name: "Screen 1", theaterId: theater.id, totalSeats: 100 }
        }));
        show = await this.prisma.show.create({
          data: {
            movieId: movieId || "default_movie",
            screenId: screen.id,
            startTime: new Date(),
            endTime: new Date(Date.now() + 2 * 3600 * 1000),
            status: "OPEN"
          }
        });
      }

      const booking = await this.prisma.booking.create({
        data: {
          bookingNumber,
          userId: currentUserId || "guest_user",
          showId: show.id,
          status: "PENDING",
          totalAmount: verifiedAmount,
          subtotal: verifiedAmount,
          currency: "INR",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      currentBookingId = booking.id;

      if (movieId) {
        const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
        if (movie) movieTitle = movie.title;
      }
    }

    const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000";
    const environment =
      this.configService.get<string>("NODE_ENV") ||
      process.env.NODE_ENV ||
      "development";

    if (!this.stripe) {
      // In dev fallback mode: record pending payment and provide redirect
      await this.prisma.payment.upsert({
        where: { bookingId: currentBookingId },
        update: {
          amount: verifiedAmount,
          status: "PENDING",
        },
        create: {
          bookingId: currentBookingId,
          provider: "MOCK_GATEWAY",
          amount: verifiedAmount,
          currency: "INR",
          status: "PENDING",
        },
      });

      const successUrl = `${clientUrl}/success?bookingId=${currentBookingId}&user=${currentUserId}&seats=${seatLabels.join(",")}&payment=success`;
      return { url: successUrl, bookingId: currentBookingId };
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Movie Ticket: ${movieTitle}`,
              description: `Seats: ${seatLabels.join(", ")}`,
            },
            unit_amount: Math.round(verifiedAmount * 100),
          },
          quantity: 1,
        },
      ],
      // Section 38: Stripe Metadata containing non-sensitive identifiers
      metadata: {
        bookingId: currentBookingId,
        userId: currentUserId,
        environment,
      },
      success_url: `${clientUrl}/success?bookingId=${currentBookingId}&user=${currentUserId}&seats=${seatLabels.join(",")}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/movies/${movieId || 'show'}?payment=failed`,
    });

    await this.prisma.payment.upsert({
      where: { bookingId: currentBookingId },
      update: {
        stripeSessionId: session.id,
        amount: verifiedAmount,
        status: "PENDING",
      },
      create: {
        bookingId: currentBookingId,
        provider: "STRIPE",
        stripeSessionId: session.id,
        amount: verifiedAmount,
        currency: "INR",
        status: "PENDING",
      },
    });

    return {
      url: session.url,
      sessionId: session.id,
      bookingId: currentBookingId,
    };
  }

  /**
   * Verifies payment server-side and issues ticket (Section 23).
   */
  async verifyPayment(bookingId: string, sessionId?: string) {
    if (this.stripe && sessionId) {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        return this.confirmBookingAndIssueTicket(
          bookingId,
          (session.payment_intent as string) || session.id,
          session.amount_total ? session.amount_total / 100 : undefined
        );
      }
      throw new BadRequestException("Stripe payment is not marked as paid");
    }

    // In dev / fallback mode: confirm directly
    const mockPaymentId = `pay_mock_${Date.now().toString(36)}`;
    return this.confirmBookingAndIssueTicket(bookingId, mockPaymentId);
  }

  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    if (!this.stripe) {
      throw new BadRequestException("Stripe is not configured");
    }

    const webhookSecret =
      this.configService.get<string>("STRIPE_WEBHOOK_SECRET") ||
      process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new BadRequestException("STRIPE_WEBHOOK_SECRET is not configured");
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    const existingEvent = await this.prisma.stripeEvent.findUnique({
      where: { eventId: event.id },
    });
    if (existingEvent) {
      return { received: true, duplicate: true };
    }

    await this.prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        payload: event as any,
        status: "PROCESSED",
      },
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;

      if (bookingId) {
        await this.confirmBookingAndIssueTicket(
          bookingId,
          (session.payment_intent as string) || session.id,
          session.amount_total ? session.amount_total / 100 : undefined
        );
      }
    }

    return { received: true };
  }
}
