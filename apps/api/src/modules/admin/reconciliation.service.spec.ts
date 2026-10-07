import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FinancialReconciliationService } from "./reconciliation.service";

describe("FinancialReconciliationService - Section 138 Invariant Tests", () => {
  it("detects unsettled confirmed bookings, unrecorded refunds, and calculation mismatches", async () => {
    const mockBookings = [
      // 1. Valid fully settled booking
      {
        id: "b-1",
        bookingNumber: "BMS-VALID-1",
        status: "CONFIRMED",
        subtotal: 500,
        convenienceFee: 60,
        taxAmount: 10.8,
        discountAmount: 0,
        totalAmount: 570.8,
        payment: { id: "p-1", status: "SUCCEEDED", amount: 570.8 },
        refunds: [],
      },
      // 2. Unsettled confirmed booking (Payment missing or pending)
      {
        id: "b-2",
        bookingNumber: "BMS-UNSETTLED-2",
        status: "CONFIRMED",
        subtotal: 250,
        convenienceFee: 30,
        taxAmount: 5.4,
        discountAmount: 0,
        totalAmount: 285.4,
        payment: { id: "p-2", status: "PENDING", amount: 285.4 },
        refunds: [],
      },
      // 3. Unrecorded refund (Status REFUNDED but refunds array empty)
      {
        id: "b-3",
        bookingNumber: "BMS-NOREFUND-3",
        status: "REFUNDED",
        subtotal: 300,
        convenienceFee: 30,
        taxAmount: 5.4,
        discountAmount: 0,
        totalAmount: 335.4,
        payment: { id: "p-3", status: "REFUNDED", amount: 335.4 },
        refunds: [],
      },
      // 4. Amount mismatch (Total doesn't match sum of parts)
      {
        id: "b-4",
        bookingNumber: "BMS-MISMATCH-4",
        status: "CONFIRMED",
        subtotal: 200,
        convenienceFee: 30,
        taxAmount: 5.4,
        discountAmount: 0,
        totalAmount: 999, // Should be 235.4
        payment: { id: "p-4", status: "SUCCEEDED", amount: 999 },
        refunds: [],
      },
    ];

    const mockPayments = [
      { id: "p-1", status: "SUCCEEDED", amount: 570.8, booking: mockBookings[0] },
      { id: "p-2", status: "PENDING", amount: 285.4, booking: mockBookings[1] },
      { id: "p-3", status: "REFUNDED", amount: 335.4, booking: mockBookings[2] },
      { id: "p-4", status: "SUCCEEDED", amount: 999, booking: mockBookings[3] },
      // 5. Orphaned payment (Payment SUCCEEDED on cancelled booking)
      {
        id: "p-5",
        status: "SUCCEEDED",
        amount: 400,
        booking: { id: "b-5", bookingNumber: "BMS-CANCELLED-5", status: "CANCELLED" },
      },
    ];

    const mockPrisma = {
      booking: {
        findMany: async () => mockBookings,
      },
      payment: {
        findMany: async () => mockPayments,
      },
    };

    const service = new FinancialReconciliationService(mockPrisma as any);
    const report = await service.runAudit();

    assert.strictEqual(report.totalBookingsAudited, 4);
    assert.strictEqual(report.totalPaymentsAudited, 5);
    assert.strictEqual(report.totalSettled, 2); // b-1 and b-4 have SUCCEEDED payments
    assert.strictEqual(report.summary.unsettledBookings, 1); // b-2
    assert.strictEqual(report.summary.unrecordedRefunds, 1); // b-3
    assert.strictEqual(report.summary.amountMismatches, 1); // b-4
    assert.strictEqual(report.summary.orphanedPayments, 1); // p-5

    const discrepancyTypes = report.discrepancies.map((d) => d.type);
    assert.ok(discrepancyTypes.includes("UNSETTLED_CONFIRMED_BOOKING"));
    assert.ok(discrepancyTypes.includes("UNRECORDED_REFUND"));
    assert.ok(discrepancyTypes.includes("AMOUNT_CALCULATION_MISMATCH"));
    assert.ok(discrepancyTypes.includes("ORPHANED_SUCCEEDED_PAYMENT"));
  });
});
