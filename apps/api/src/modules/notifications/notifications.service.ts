import { Injectable, Logger } from "@nestjs/common";
import crypto from "crypto";

export interface InAppNotification {
  id: string;
  userId: string;
  event: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // In-app notifications stored per user
  private readonly notifications: Map<string, InAppNotification[]> = new Map();

  /**
   * Section 86: Dispatch Notification across In-App & Email channels
   */
  async notify(data: {
    userId: string;
    userEmail?: string;
    event:
      | "BOOKING_CONFIRMED"
      | "PAYMENT_FAILED"
      | "BOOKING_EXPIRED"
      | "TICKET_ISSUED"
      | "REFUND_COMPLETED"
      | "SHOW_CANCELLED";
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<InAppNotification> {
    const { userId, userEmail, event, title, message, metadata } = data;

    // 1. Create In-App Notification record
    const notification: InAppNotification = {
      id: `notif_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      userId,
      event,
      title,
      message,
      data: metadata,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const userList = this.notifications.get(userId) || [];
    userList.unshift(notification);
    // Keep last 50 notifications per user
    if (userList.length > 50) userList.pop();
    this.notifications.set(userId, userList);

    this.logger.log(
      `[In-App Notification] Event=${event} User=${userId} Title="${title}"`
    );

    // 2. Section 87: Dispatch Transactional Email
    if (userEmail) {
      await this.sendTransactionalEmail({
        to: userEmail,
        subject: `BookMyShow: ${title}`,
        html: this.renderEmailHtml(event, title, message, metadata),
        text: message,
      });
    }

    return notification;
  }

  /**
   * Section 87: Transactional Email Delivery Provider Abstraction
   */
  async sendTransactionalEmail(payload: EmailPayload): Promise<boolean> {
    this.logger.log(
      `[Transactional Email] To=${payload.to} Subject="${payload.subject}"`
    );
    // In production, integrate Resend/SendGrid/SES here.
    return true;
  }

  /**
   * Generates clean HTML template for transactional emails
   */
  private renderEmailHtml(
    event: string,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 24px;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
            <div style="background-color: #e11d48; padding: 20px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">BookMyShow</h1>
            </div>
            <div style="padding: 24px;">
              <h2 style="color: #111827; font-size: 18px; margin-top: 0;">${title}</h2>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">${message}</p>
              ${
                metadata?.ticketNumber
                  ? `<div style="background: #f3f4f6; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px; color: #1f2937;">
                      <strong>Ticket Reference:</strong> ${metadata.ticketNumber}<br/>
                      ${metadata.movieTitle ? `<strong>Movie:</strong> ${metadata.movieTitle}<br/>` : ""}
                      ${metadata.seatLabels ? `<strong>Seats:</strong> ${metadata.seatLabels}` : ""}
                    </div>`
                  : ""
              }
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                This is an automated transactional message regarding event <code>${event}</code>.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getUserNotifications(userId: string): InAppNotification[] {
    return this.notifications.get(userId) || [];
  }

  markAsRead(notificationId: string, userId: string): boolean {
    const list = this.notifications.get(userId) || [];
    const item = list.find((n) => n.id === notificationId);
    if (item) {
      item.read = true;
      return true;
    }
    return false;
  }
}
