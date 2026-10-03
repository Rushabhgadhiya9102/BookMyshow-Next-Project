import { Body, Controller, Get, Post } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Public()
  @Get()
  async findAll() {
    return this.ticketsService.findAll();
  }

  @Public()
  @Post()
  async create(
    @Body()
    body: {
      movieId: string;
      userId: string;
      seats: string[];
      amount: number;
      paymentStatus?: string;
    }
  ) {
    return this.ticketsService.create(body);
  }
}
