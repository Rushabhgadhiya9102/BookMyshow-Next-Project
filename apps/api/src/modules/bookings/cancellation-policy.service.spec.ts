import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CancellationPolicyService } from "./cancellation-policy.service";

describe("CancellationPolicyService - Section 125 & 126 Invariant Tests", () => {
  const policyService = new CancellationPolicyService();

  it("permits 100% refund when cancellation is requested > 24 hours before showtime", () => {
    // Show is 48 hours from now
    const futureShowTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const totalAmount = 1000;

    const evaluation = policyService.evaluate(futureShowTime, totalAmount);

    assert.strictEqual(evaluation.isEligible, true);
    assert.strictEqual(evaluation.policyTier, "FULL_REFUND");
    assert.strictEqual(evaluation.refundPercentage, 100);
    assert.strictEqual(evaluation.refundAmount, 1000);
    assert.strictEqual(evaluation.cancellationFee, 0);
  });

  it("applies 75% refund (25% fee) when cancellation is requested between 2 and 24 hours before showtime", () => {
    // Show is 6 hours from now
    const upcomingShowTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const totalAmount = 800;

    const evaluation = policyService.evaluate(upcomingShowTime, totalAmount);

    assert.strictEqual(evaluation.isEligible, true);
    assert.strictEqual(evaluation.policyTier, "PARTIAL_REFUND");
    assert.strictEqual(evaluation.refundPercentage, 75);
    assert.strictEqual(evaluation.refundAmount, 600); // 75% of 800
    assert.strictEqual(evaluation.cancellationFee, 200); // 25% of 800
  });

  it("rejects cancellation within 2 hours of showtime with BadRequestException", () => {
    // Show is 45 minutes from now
    const imminentShowTime = new Date(Date.now() + 45 * 60 * 1000);
    const totalAmount = 500;

    assert.throws(
      () => {
        policyService.evaluate(imminentShowTime, totalAmount);
      },
      (err: any) => {
        assert.ok(err.message.includes("Cancellation restricted"));
        return true;
      }
    );
  });

  it("rejects cancellation for shows that have already started or concluded", () => {
    // Show started 30 minutes ago
    const pastShowTime = new Date(Date.now() - 30 * 60 * 1000);
    const totalAmount = 500;

    assert.throws(
      () => {
        policyService.evaluate(pastShowTime, totalAmount);
      },
      (err: any) => {
        assert.ok(err.message.includes("Show has already started or concluded"));
        return true;
      }
    );
  });
});
