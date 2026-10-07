import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { PaymentsService } from "./payments.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post("stripe-session")
  async createStripeSession(
    @Body()
    body: {
      amount: number;
      movieId: string;
      userId: string;
      selectedSeats: string[];
      bookingId?: string;
    }
  ) {
    return this.paymentsService.createStripeSession(body);
  }

  @Public()
  @Post("verify")
  async verifyPayment(
    @Body()
    body: {
      bookingId: string;
      sessionId?: string;
    }
  ) {
    return this.paymentsService.verifyPayment(body.bookingId, body.sessionId);
  }

  @Public()
  @Post("webhook")
  async handleWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() req: Request & { rawBody?: Buffer }
  ) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.handleStripeWebhook(signature, rawBody);
  }

  @Public()
  @Post("webhooks/stripe")
  async handleStripeWebhookAlias(
    @Headers("stripe-signature") signature: string,
    @Req() req: Request & { rawBody?: Buffer }
  ) {
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    return this.paymentsService.handleStripeWebhook(signature, rawBody);
  }
}
