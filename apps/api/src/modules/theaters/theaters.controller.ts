import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { TheatersService } from "./theaters.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("theaters")
export class TheatersController {
  constructor(private readonly theatersService: TheatersService) {}

  @Public()
  @Get("cities")
  async getCities() {
    return this.theatersService.getCities();
  }

  @Public()
  @Post("cities")
  async createCity(@Body() body: { name: string; state?: string }) {
    return this.theatersService.createCity(body.name, body.state);
  }

  @Public()
  @Get()
  async findAll(@Query("cityId") cityId?: string) {
    return this.theatersService.findAll(cityId);
  }

  @Public()
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.theatersService.findOne(id);
  }

  @Public()
  @Post()
  async createTheater(
    @Body()
    body: {
      name: string;
      cityId: string;
      address: string;
      amenities?: string[];
      description?: string;
    }
  ) {
    return this.theatersService.createTheater(body);
  }
}
