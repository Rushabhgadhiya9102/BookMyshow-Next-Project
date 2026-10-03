import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SeatsService } from "./seats.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("seats")
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Public()
  @Get(":movieId")
  async getSeats(@Param("movieId") movieId: string) {
    return this.seatsService.getSeatsByMovieId(movieId);
  }

  @Public()
  @Post(":movieId")
  async bookSeats(
    @Param("movieId") movieId: string,
    @Body() body: { userId: string; seats: string[] }
  ) {
    return this.seatsService.bookSeats(movieId, body.userId, body.seats);
  }
}
