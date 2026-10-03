import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { BookingsService } from "./bookings.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post("holds")
  async createHold(
    @Body()
    body: {
      showId: string;
      seatIds: string[];
      userId: string;
    }
  ) {
    return this.bookingsService.createHold(body);
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
