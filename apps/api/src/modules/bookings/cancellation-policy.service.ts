import { Injectable, BadRequestException, Logger } from "@nestjs/common";

export interface CancellationEvaluation {
  isEligible: boolean;
  hoursRemaining: number;
  refundPercentage: number;
  totalAmount: number;
  refundAmount: number;
  cancellationFee: number;
  policyTier: "FULL_REFUND" | "PARTIAL_REFUND" | "RESTRICTED" | "EXPIRED";
  reason: string;
}

@Injectable()
export class CancellationPolicyService {
  private readonly logger = new Logger(CancellationPolicyService.name);

  /**
   * Section 125 & 126: Evaluates booking cancellation eligibility strictly
   * based on the show's start time relative to current time.
   *
   * Rules:
   * - Show already started / concluded -> 400 Bad Request (not eligible)
   * - Starts in < 2 hours -> 400 Bad Request (restricted window)
   * - Starts in 2 to 24 hours -> Eligible for 75% refund (25% cancellation penalty)
   * - Starts in > 24 hours -> Eligible for 100% refund (0% cancellation penalty)
   */
  evaluate(showStartTime: Date | string, totalAmount: number): CancellationEvaluation {
    const showDate = new Date(showStartTime);
    const now = new Date();

    if (isNaN(showDate.getTime())) {
      throw new BadRequestException("Invalid show start time format");
    }

    const diffMs = showDate.getTime() - now.getTime();
    const hoursRemaining = diffMs / (1000 * 60 * 60);

    if (diffMs <= 0) {
      throw new BadRequestException(
        "Cancellation rejected (Section 125): Show has already started or concluded."
      );
    }

    if (hoursRemaining < 2) {
      throw new BadRequestException(
        `Cancellation restricted (Section 125): Bookings cannot be cancelled within 2 hours of showtime (${hoursRemaining.toFixed(1)} hours remaining).`
      );
    }

    if (hoursRemaining < 24) {
      // 75% refund (25% cancellation penalty)
      // Use integer minor units to eliminate floating-point precision error
      const totalPaise = Math.round(totalAmount * 100);
      const feePaise = Math.round(totalPaise * 0.25);
      const refundPaise = totalPaise - feePaise;

      return {
        isEligible: true,
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
        refundPercentage: 75,
        totalAmount,
        refundAmount: refundPaise / 100,
        cancellationFee: feePaise / 100,
        policyTier: "PARTIAL_REFUND",
        reason: `Cancellation within 24 hours of showtime. 75% refund eligible (25% fee deducted).`,
      };
    }

    // Greater than or equal to 24 hours: 100% refund
    return {
      isEligible: true,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      refundPercentage: 100,
      totalAmount,
      refundAmount: totalAmount,
      cancellationFee: 0,
      policyTier: "FULL_REFUND",
      reason: `Full refund eligible (> 24 hours prior to showtime).`,
    };
  }
}
