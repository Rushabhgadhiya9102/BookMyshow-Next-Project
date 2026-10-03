import {
  Injectable,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
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

  async createStripeSession(data: {
    amount: number;
    movieId: string;
    userId: string;
    selectedSeats: string[];
    bookingId?: string;
  }) {
    const { amount, movieId, userId, selectedSeats, bookingId } = data;

    let currentBookingId = bookingId;
    if (!currentBookingId) {
      const bookingNumber = `BMS-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      let show = await this.prisma.show.findFirst({ where: { movieId } });
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
            movieId,
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
          userId,
          showId: show.id,
          status: "PENDING",
          totalAmount: Number(amount),
          subtotal: Number(amount),
          currency: "INR",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      currentBookingId = booking.id;
    }

    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    const movieTitle = movie ? movie.title : `Movie ${movieId}`;

    const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000";

    if (!this.stripe) {
      const successUrl = `${clientUrl}/movies/${movieId}?payment=success&user=${userId}&seats=${selectedSeats.join(",")}&bookingId=${currentBookingId}`;
      return { url: successUrl };
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
              description: `Seats: ${selectedSeats.join(", ")}`,
            },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: currentBookingId,
        userId,
        movieId,
        selectedSeats: selectedSeats.join(","),
      },
      success_url: `${clientUrl}/movies/${movieId}?payment=success&user=${userId}&seats=${selectedSeats.join(",")}&bookingId=${currentBookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/movies/${movieId}?payment=failed`,
    });

    await this.prisma.payment.upsert({
      where: { bookingId: currentBookingId },
      update: {
        stripeSessionId: session.id,
        amount: Number(amount),
        status: "PENDING",
      },
      create: {
        bookingId: currentBookingId,
        provider: "STRIPE",
        stripeSessionId: session.id,
        amount: Number(amount),
        currency: "INR",
        status: "PENDING",
      },
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
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
        await this.prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: "CONFIRMED" },
          });

          await tx.payment.updateMany({
            where: { bookingId },
            data: {
              status: "SUCCEEDED",
              providerPaymentId: session.payment_intent as string,
              paidAt: new Date(),
            },
          });

          const bookingSeats = await tx.bookingSeat.findMany({
            where: { bookingId },
          });

          if (bookingSeats.length > 0) {
            await tx.showSeat.updateMany({
              where: {
                id: { in: bookingSeats.map((b) => b.showSeatId) },
              },
              data: {
                status: "BOOKED",
                bookedAt: new Date(),
              },
            });
          }

          const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          await tx.ticket.create({
            data: {
              bookingId,
              ticketNumber,
              qrCodePayload: JSON.stringify({
                ticketNumber,
                bookingId,
                amount: session.amount_total ? session.amount_total / 100 : 0,
              }),
              seatCount: bookingSeats.length || 1,
              status: "ACTIVE",
            },
          });
        });
      }
    }

    return { received: true };
  }
}
