import { Injectable, Logger } from "@nestjs/common";
import { NotificationsService } from "../notifications/notifications.service";

export type DomainEventType =
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "PAYMENT_FAILED"
  | "REFUND_PROCESSED"
  | "TICKET_GENERATED";

export interface DomainEvent<T = any> {
  id: string;
  type: DomainEventType;
  payload: T;
  timestamp: string;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly handlers: Map<DomainEventType, Set<EventHandler>> = new Map();

  constructor(private readonly notificationsService: NotificationsService) {
    this.registerDefaultHandlers();
  }

  /**
   * Registers a callback for a specific domain event.
   */
  on<T = any>(eventType: DomainEventType, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);
  }

  /**
   * Section 127: Non-blocking asynchronous event emission.
   * Dispatches the event on Node's microtask queue so the calling HTTP controller
   * returns immediately without waiting for notification, email rendering, or logging.
   */
  emitAsync<T = any>(eventType: DomainEventType, payload: T): void {
    const event: DomainEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`[EventBus] Enqueued asynchronous domain event: ${eventType} (ID: ${event.id})`);

    // Asynchronously dispatch on microtask queue
    queueMicrotask(async () => {
      try {
        const listeners = this.handlers.get(eventType);
        if (listeners && listeners.size > 0) {
          const tasks = Array.from(listeners).map((handler) =>
            Promise.resolve(handler(event)).catch((err) => {
              this.logger.error(
                `[EventBus] Error in event listener for ${eventType} (ID: ${event.id}): ${err.message}`,
                err.stack
              );
            })
          );
          await Promise.allSettled(tasks);
        }
      } catch (err: any) {
        this.logger.error(
          `[EventBus] Unhandled failure processing async event ${eventType}: ${err.message}`,
          err.stack
        );
      }
    });
  }

  /**
   * Default handlers wired to NotificationsService (Section 86, 87, 127).
   */
  private registerDefaultHandlers() {
    this.on("BOOKING_CONFIRMED", async (event) => {
      const { booking, userEmail } = event.payload || {};
      if (booking?.userId) {
        await this.notificationsService.notify({
          userId: booking.userId,
          userEmail: userEmail || booking.user?.email,
          event: "BOOKING_CONFIRMED",
          title: "Booking Confirmed! 🎉",
          message: `Your booking #${booking.bookingNumber} for ${booking.show?.movie?.title || "Movie"} has been confirmed.`,
          metadata: {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            totalAmount: booking.totalAmount,
          },
        });
      }
    });

    this.on("BOOKING_CANCELLED", async (event) => {
      const { booking, userEmail } = event.payload || {};
      if (booking?.userId) {
        await this.notificationsService.notify({
          userId: booking.userId,
          userEmail: userEmail || booking.user?.email,
          event: "SHOW_CANCELLED",
          title: "Booking Cancelled",
          message: `Your booking #${booking.bookingNumber} has been cancelled.`,
          metadata: { bookingId: booking.id },
        });
      }
    });

    this.on("PAYMENT_FAILED", async (event) => {
      const { userId, userEmail, bookingNumber, reason } = event.payload || {};
      if (userId) {
        await this.notificationsService.notify({
          userId,
          userEmail,
          event: "PAYMENT_FAILED",
          title: "Payment Unsuccessful ⚠️",
          message: `Payment for booking #${bookingNumber || ""} could not be completed. Reason: ${reason || "Transaction declined"}.`,
          metadata: { reason },
        });
      }
    });

    this.on("REFUND_PROCESSED", async (event) => {
      const { booking, refund, userEmail } = event.payload || {};
      if (booking?.userId) {
        await this.notificationsService.notify({
          userId: booking.userId,
          userEmail: userEmail || booking.user?.email,
          event: "REFUND_COMPLETED",
          title: "Refund Processed 💳",
          message: `Refund of ₹${refund?.amount || booking.totalAmount} for booking #${booking.bookingNumber} has been initiated.`,
          metadata: {
            refundId: refund?.id,
            amount: refund?.amount,
          },
        });
      }
    });
  }
}
