import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { MetricsService } from "@/modules/metrics/metrics.service";

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService
  ) {}

  /**
   * Section 44: QR Verification at theater entrance.
   * Atomically verifies ticket validity and marks it as USED.
   * Prevents double entry / replay scans.
   */
  async verifyTicket(ticketNumber: string) {
    if (!ticketNumber || !ticketNumber.trim()) {
      throw new BadRequestException("ticketNumber is required");
    }

    const cleanTicketNumber = ticketNumber.trim();

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { ticketNumber: cleanTicketNumber },
        include: {
          booking: {
            include: {
              show: {
                include: {
                  movie: true,
                  screen: {
                    include: { theater: true },
                  },
                },
              },
              bookingSeats: {
                include: {
                  showSeat: {
                    include: { seat: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket '${cleanTicketNumber}' not found`);
      }

      if (ticket.status === "USED") {
        this.metricsService.increment("ticket.validation.duplicate");
        throw new ConflictException(
          `Ticket '${cleanTicketNumber}' has already been scanned and used at ${ticket.updatedAt.toISOString()}`
        );
      }

      if (ticket.status === "CANCELLED") {
        throw new BadRequestException(
          `Ticket '${cleanTicketNumber}' is INVALID. This booking was cancelled or refunded.`
        );
      }

      if (ticket.status !== "ACTIVE") {
        throw new BadRequestException(
          `Ticket '${cleanTicketNumber}' has unrecognised status: ${ticket.status}`
        );
      }

      // Mark ticket as USED atomically
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "USED",
        },
      });

      this.metricsService.increment("ticket.validation.success");

      const movieTitle = ticket.booking.show.movie.title;
      const theaterName = ticket.booking.show.screen.theater.name;
      const screenName = ticket.booking.show.screen.name;
      const seats = ticket.booking.bookingSeats.map(
        (bs) => `${bs.showSeat.seat.rowLabel}${bs.showSeat.seat.seatNumber}`
      );

      this.logger.log(
        `Ticket ${cleanTicketNumber} successfully scanned and marked USED for movie '${movieTitle}'.`
      );

      return {
        valid: true,
        message: "Ticket verified successfully. Access granted.",
        ticketNumber: updatedTicket.ticketNumber,
        status: updatedTicket.status,
        movieTitle,
        theaterName,
        screenName,
        startTime: ticket.booking.show.startTime,
        seats,
        seatCount: ticket.seatCount,
        verifiedAt: new Date(),
      };
    });
  }

  /**
   * Retrieves full ticket details by ticketNumber.
   */
  async getTicket(ticketNumber: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        booking: {
          include: {
            show: {
              include: {
                movie: true,
                screen: { include: { theater: true } },
              },
            },
            bookingSeats: {
              include: {
                showSeat: { include: { seat: true } },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket '${ticketNumber}' not found`);
    }

    return ticket;
  }
}
