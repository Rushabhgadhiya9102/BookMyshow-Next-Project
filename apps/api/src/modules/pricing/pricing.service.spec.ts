import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PricingService } from "./pricing.service";

describe("PricingService - Section 123 & 124 Invariant Tests", () => {
  // Mock PrismaService for isolated unit testing
  const mockPrisma = {
    show: {
      findUnique: async ({ where, include }: any) => {
        if (where.id === "show-not-found") return null;

        const allSeats = [
          {
            id: "ss-1",
            seatId: "seat-1",
            seat: { seatNumber: "A1", tier: "RECLINER" },
          },
          {
            id: "ss-2",
            seatId: "seat-2",
            seat: { seatNumber: "B1", tier: "PLATINUM" },
          },
          {
            id: "ss-3",
            seatId: "seat-3",
            seat: { seatNumber: "D1", tier: "GOLD" },
          },
        ];

        const seatOrFilters = include?.showSeats?.where?.OR || [];
        const allowedIds: string[] = [];
        for (const f of seatOrFilters) {
          if (f.id?.in) allowedIds.push(...f.id.in);
          if (f.seatId?.in) allowedIds.push(...f.seatId.in);
        }

        const filteredSeats =
          allowedIds.length > 0
            ? allSeats.filter(
                (s) => allowedIds.includes(s.id) || allowedIds.includes(s.seatId)
              )
            : allSeats;

        return {
          id: "show-1",
          showPrices: [
            { tier: "RECLINER", price: 500 },
            { tier: "PLATINUM", price: 350 },
            { tier: "GOLD", price: 250 },
            { tier: "SILVER", price: 150 },
          ],
          showSeats: filteredSeats,
        };
      },
    },
  };

  const service = new PricingService(mockPrisma as any);

  it("calculates accurate subtotal, convenience fee (₹30/seat), and 18% GST in integer paise", async () => {
    const result = await service.calculatePrice({
      showId: "show-1",
      seatIds: ["ss-1", "ss-2"], // Recliner (₹500) + Platinum (₹350)
    });

    // Subtotal: 500 + 350 = ₹850 (85000 paise)
    assert.strictEqual(result.subtotalRupees, 850);
    assert.strictEqual(result.subtotalPaise, 85000);
    assert.strictEqual(result.seatCount, 2);

    // Convenience fee: 2 seats * ₹30 = ₹60 (6000 paise)
    assert.strictEqual(result.convenienceFeeRupees, 60);
    assert.strictEqual(result.convenienceFeePaise, 6000);

    // GST on convenience fee: 18% of 6000 = 1080 paise (₹10.80)
    assert.strictEqual(result.convenienceTaxRupees, 10.8);
    assert.strictEqual(result.convenienceTaxPaise, 1080);

    // Total: 85000 + 6000 + 1080 = 92080 paise = ₹920.80
    assert.strictEqual(result.totalPaise, 92080);
    assert.strictEqual(result.totalRupees, 920.8);
  });

  it("applies valid percentage coupon with cap correctly (WELCOME50)", async () => {
    const result = await service.calculatePrice({
      showId: "show-1",
      seatIds: ["ss-1", "ss-2"], // Subtotal: ₹850
      couponCode: "welcome50", // 50% discount capped at ₹150 (15000 paise)
    });

    assert.ok(result.appliedCoupon);
    assert.strictEqual(result.appliedCoupon.code, "WELCOME50");
    // 50% of 850 is 425, but max cap is ₹150 (15000 paise)
    assert.strictEqual(result.discountRupees, 150);
    assert.strictEqual(result.discountPaise, 15000);

    // Taxable: 850 - 150 = 700 (70000 paise)
    assert.strictEqual(result.taxableRupees, 700);

    // Total: 70000 + 6000 (fee) + 1080 (tax) = 77080 paise = ₹770.80
    assert.strictEqual(result.totalPaise, 77080);
    assert.strictEqual(result.totalRupees, 770.8);
  });

  it("enforces minimum spend requirement for coupons", async () => {
    // FLAT100 requires min spend of ₹400
    // Try with a single Gold seat (₹250 = 25000 paise)
    await assert.rejects(
      async () => {
        await service.calculatePrice({
          showId: "show-1",
          seatIds: ["ss-3"], // Gold: ₹250
          couponCode: "FLAT100",
        });
      },
      {
        message: "Coupon FLAT100 requires a minimum ticket subtotal of ₹400",
      }
    );
  });

  it("rejects invalid coupon codes", async () => {
    await assert.rejects(
      async () => {
        await service.calculatePrice({
          showId: "show-1",
          seatIds: ["ss-1"],
          couponCode: "INVALID_PROMO",
        });
      },
      {
        message: "Invalid or expired coupon code: INVALID_PROMO",
      }
    );
  });

  it("throws NotFoundException when show is not found", async () => {
    await assert.rejects(
      async () => {
        await service.calculatePrice({
          showId: "show-not-found",
          seatIds: ["ss-1"],
        });
      },
      {
        message: "Show with ID show-not-found not found",
      }
    );
  });
});
