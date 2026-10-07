import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export interface ReconciliationDiscrepancy {
  type:
    | "UNSETTLED_CONFIRMED_BOOKING"
    | "ORPHANED_SUCCEEDED_PAYMENT"
    | "UNRECORDED_REFUND"
    | "AMOUNT_CALCULATION_MISMATCH"
    | "PAYMENT_AMOUNT_MISMATCH";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  bookingId?: string;
  bookingNumber?: string;
  paymentId?: string;
  description: string;
  details: Record<string, any>;
}

export interface ReconciliationReport {
  timestamp: string;
  totalBookingsAudited: number;
  totalPaymentsAudited: number;
  totalSettled: number;
  totalDiscrepancies: number;
  discrepancies: ReconciliationDiscrepancy[];
  summary: {
    unsettledBookings: number;
    orphanedPayments: number;
    unrecordedRefunds: number;
    amountMismatches: number;
  };
}

@Injectable()
export class FinancialReconciliationService {
  private readonly logger = new Logger(FinancialReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Section 138: Financial reconciliation engine.
   * Audits database records across Bookings, Payments, and Refunds to detect
   * mismatches, unrecorded financial states, or orphaned transactions.
   */
  async runAudit(): Promise<ReconciliationReport> {
    const discrepancies: ReconciliationDiscrepancy[] = [];

    // Fetch all non-pending bookings with payment and refund relations
    const bookings = await this.prisma.booking.findMany({
      include: {
        payment: true,
        refunds: true,
      },
    });

    const payments = await this.prisma.payment.findMany({
      include: {
        booking: true,
      },
    });

    let settledCount = 0;
    let unsettledCount = 0;
    let unrecordedRefundsCount = 0;
    let amountMismatchesCount = 0;

    for (const b of bookings) {
      // 1. Check for Confirmed Bookings lacking Succeeded Payment (Invariant 2)
      if (b.status === "CONFIRMED") {
        if (!b.payment || b.payment.status !== "SUCCEEDED") {
          unsettledCount++;
          discrepancies.push({
            type: "UNSETTLED_CONFIRMED_BOOKING",
            severity: "CRITICAL",
            bookingId: b.id,
            bookingNumber: b.bookingNumber,
            paymentId: b.payment?.id,
            description: `Booking #${b.bookingNumber} is CONFIRMED but payment status is ${b.payment?.status || "MISSING"}`,
            details: {
              bookingStatus: b.status,
              paymentStatus: b.payment?.status || null,
              expectedAmount: b.totalAmount,
            },
          });
        } else {
          settledCount++;
        }
      }

      // 2. Check for Refunded Bookings lacking Refund Record
      if (b.status === "REFUNDED") {
        const hasSucceededRefund = b.refunds.some((r) => r.status === "SUCCEEDED");
        if (!hasSucceededRefund) {
          unrecordedRefundsCount++;
          discrepancies.push({
            type: "UNRECORDED_REFUND",
            severity: "HIGH",
            bookingId: b.id,
            bookingNumber: b.bookingNumber,
            description: `Booking #${b.bookingNumber} is marked REFUNDED but has no successful Refund ledger record`,
            details: {
              bookingStatus: b.status,
              refundCount: b.refunds.length,
            },
          });
        }
      }

      // 3. Check for Amount Calculation Mismatch
      const computedTotal =
        (b.subtotal || 0) +
        (b.convenienceFee || 0) +
        (b.taxAmount || 0) -
        (b.discountAmount || 0);

      // Minor unit / float comparison tolerance of ₹0.01
      if (Math.abs(b.totalAmount - computedTotal) > 0.01) {
        amountMismatchesCount++;
        discrepancies.push({
          type: "AMOUNT_CALCULATION_MISMATCH",
          severity: "MEDIUM",
          bookingId: b.id,
          bookingNumber: b.bookingNumber,
          description: `Total amount mismatch for booking #${b.bookingNumber}: recorded ₹${b.totalAmount} vs computed ₹${computedTotal}`,
          details: {
            recordedTotal: b.totalAmount,
            computedTotal,
            subtotal: b.subtotal,
            convenienceFee: b.convenienceFee,
            taxAmount: b.taxAmount,
            discountAmount: b.discountAmount,
          },
        });
      }

      // 4. Check for Payment Amount Mismatch
      if (b.payment && Math.abs(b.payment.amount - b.totalAmount) > 0.01) {
        discrepancies.push({
          type: "PAYMENT_AMOUNT_MISMATCH",
          severity: "HIGH",
          bookingId: b.id,
          bookingNumber: b.bookingNumber,
          paymentId: b.payment.id,
          description: `Payment amount (₹${b.payment.amount}) does not match booking total (₹${b.totalAmount})`,
          details: {
            paymentAmount: b.payment.amount,
            bookingTotal: b.totalAmount,
          },
        });
      }
    }

    // 5. Check for Orphaned Succeeded Payments
    let orphanedPaymentsCount = 0;
    for (const p of payments) {
      if (p.status === "SUCCEEDED" && p.booking) {
        if (p.booking.status !== "CONFIRMED" && p.booking.status !== "REFUNDED") {
          orphanedPaymentsCount++;
          discrepancies.push({
            type: "ORPHANED_SUCCEEDED_PAYMENT",
            severity: "HIGH",
            bookingId: p.booking.id,
            bookingNumber: p.booking.bookingNumber,
            paymentId: p.id,
            description: `Payment #${p.id} is SUCCEEDED but associated booking is ${p.booking.status}`,
            details: {
              paymentAmount: p.amount,
              bookingStatus: p.booking.status,
            },
          });
        }
      }
    }

    this.logger.log(
      `[Reconciliation] Audited ${bookings.length} bookings & ${payments.length} payments. Found ${discrepancies.length} discrepancies.`
    );

    return {
      timestamp: new Date().toISOString(),
      totalBookingsAudited: bookings.length,
      totalPaymentsAudited: payments.length,
      totalSettled: settledCount,
      totalDiscrepancies: discrepancies.length,
      discrepancies,
      summary: {
        unsettledBookings: unsettledCount,
        orphanedPayments: orphanedPaymentsCount,
        unrecordedRefunds: unrecordedRefundsCount,
        amountMismatches: amountMismatchesCount,
      },
    };
  }
}
