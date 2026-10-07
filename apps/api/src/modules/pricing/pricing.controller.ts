import { Body, Controller, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { PricingService } from "./pricing.service";
import { CalculatePriceDto } from "./pricing.dto";

@Controller("pricing")
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  /**
   * Section 123: Authoritative pricing calculation preview.
   * Client calls this to retrieve precise fee, GST, discount, and total breakdowns
   * calculated entirely server-side without floating-point errors.
   */
  @Public()
  @Post("calculate")
  @HttpCode(HttpStatus.OK)
  async calculate(@Body() dto: CalculatePriceDto) {
    return this.pricingService.calculatePrice(dto);
  }
}
