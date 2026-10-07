import { Module } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { BookingsController } from "./bookings.controller";
import { SeatLockService } from "./seat-lock.service";
import { CancellationPolicyService } from "./cancellation-policy.service";
import { SeatsModule } from "../seats/seats.module";
import { PricingModule } from "../pricing/pricing.module";

@Module({
  imports: [SeatsModule, PricingModule],
  controllers: [BookingsController],
  providers: [BookingsService, SeatLockService, CancellationPolicyService],
  exports: [BookingsService, SeatLockService, CancellationPolicyService],
})
export class BookingsModule {}
