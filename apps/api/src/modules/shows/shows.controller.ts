import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ShowsService } from "./shows.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("shows")
export class ShowsController {
  constructor(private readonly showsService: ShowsService) {}

  @Public()
  @Get()
  async findAll(
    @Query("movieId") movieId?: string,
    @Query("date") date?: string
  ) {
    return this.showsService.findAll(movieId, date);
  }

  @Public()
  @Get("movie/:movieId")
  async getMovieTheatersAndShows(
    @Param("movieId") movieId: string,
    @Query("city") city?: string,
    @Query("date") date?: string
  ) {
    return this.showsService.getMovieTheatersAndShows(movieId, city, date);
  }

  @Public()
  @Get(":id/seats")
  async getShowSeats(@Param("id") id: string) {
    return this.showsService.getShowSeats(id);
  }

  @Public()
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.showsService.findOne(id);
  }

  @Public()
  @Post()
  async create(
    @Body()
    body: {
      movieId: string;
      screenId: string;
      startTime: string;
      endTime: string;
      prices: Array<{ tier: string; price: number }>;
    }
  ) {
    return this.showsService.create(body);
  }
}
