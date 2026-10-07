import { Body, Controller, Get, Param, Post, Headers } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Section 79: Mutating endpoints accept Idempotency-Key
   */
  @Public()
  @Post("holds")
  async createHold(
    @Body()
    body: {
      showId: string;
      seatIds: string[];
      userId: string;
      idempotencyKey?: string;
    },
    @Headers("idempotency-key") idempotencyHeader?: string,
    @Headers("Idempotency-Key") idempotencyHeaderPascal?: string
  ) {
    const idempotencyKey =
      idempotencyHeader || idempotencyHeaderPascal || body.idempotencyKey;
    return this.bookingsService.createHold({
      ...body,
      idempotencyKey,
    });
  }

  @Public()
  @Post("holds/:id/release")
  async releaseHold(
    @Param("id") id: string,
    @Body() body?: { userId?: string }
  ) {
    return this.bookingsService.releaseHold(id, body?.userId);
  }

  /**
   * Section 47 & 79: Cancel booking endpoint
   */
  @Public()
  @Post(":id/cancel")
  async cancelBooking(
    @Param("id") id: string,
    @Body() body?: { reason?: string; userId?: string }
  ) {
    return this.bookingsService.releaseHold(id, body?.userId);
  }

  @Public()
  @Post(":id/refund")
  async requestRefund(
    @Param("id") id: string,
    @Body() body?: { reason?: string; userId?: string }
  ) {
    return this.bookingsService.requestRefund({
      bookingId: id,
      reason: body?.reason,
      userId: body?.userId,
    });
  }

  @Public()
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.bookingsService.findOne(id);
  }

  @Public()
  @Get("user/:userId")
  async getUserBookings(@Param("userId") userId: string) {
    return this.bookingsService.getUserBookings(userId);
  }
}
