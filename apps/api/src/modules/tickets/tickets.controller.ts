import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { Public } from "@/common/decorators/public.decorator";

@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * Section 44: Entrance scanner verification endpoint.
   * Scans QR payload or ticketNumber and marks ticket USED atomically.
   */
  @Public()
  @Post("verify")
  async verifyTicket(
    @Body()
    body: {
      ticketNumber?: string;
      qrPayload?: string;
    }
  ) {
    let resolvedTicketNumber = body.ticketNumber;

    if (!resolvedTicketNumber && body.qrPayload) {
      try {
        const parsed = JSON.parse(body.qrPayload);
        resolvedTicketNumber = parsed.ticketNumber;
      } catch {
        resolvedTicketNumber = body.qrPayload;
      }
    }

    return this.ticketsService.verifyTicket(resolvedTicketNumber || "");
  }

  @Public()
  @Get(":ticketNumber")
  async getTicket(@Param("ticketNumber") ticketNumber: string) {
    return this.ticketsService.getTicket(ticketNumber);
  }
}
