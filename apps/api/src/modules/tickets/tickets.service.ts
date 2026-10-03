import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  private mapTicket(ticket: any) {
    if (!ticket) return null;
    let qrData: any = {};
    try {
      qrData = ticket.qrCodePayload ? JSON.parse(ticket.qrCodePayload) : {};
    } catch {
      qrData = {};
    }

    const booking = ticket.booking;
    const movieId = qrData.movieId || booking?.show?.movieId || "";
    const userId = qrData.userId || booking?.userId || "";
    const seats =
      qrData.seats ||
      booking?.bookingSeats?.map((b: any) => b.showSeat?.seat?.seatNumber) ||
      [];
    const amount = qrData.amount || booking?.totalAmount || 0;
    const paymentStatus =
      qrData.paymentStatus || (ticket.status === "ACTIVE" ? "success" : "pending");

    return {
      ...ticket,
      _id: ticket.id,
      movieId,
      userId,
      seats,
      seatCount: ticket.seatCount || seats.length || 1,
      amount,
      paymentStatus,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }

  async findAll() {
    const tickets = await this.prisma.ticket.findMany({
      include: {
        booking: {
          include: {
            show: true,
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
      orderBy: { createdAt: "desc" },
    });

    return {
      message: "ticket fetch successfully",
      tickets: tickets.map((t) => this.mapTicket(t)),
      status: 200,
    };
  }

  async create(data: {
    movieId: string;
    userId: string;
    seats: string[];
    amount: number;
    paymentStatus?: string;
  }) {
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let show = await this.prisma.show.findFirst({ where: { movieId: data.movieId } });
    if (!show) {
      let screen = await this.prisma.screen.findFirst();
      if (!screen) {
        let city =
          (await this.prisma.city.findFirst()) ||
          (await this.prisma.city.create({
            data: { name: "Default City", slug: `city-${Date.now().toString(36)}` },
          }));
        let theater =
          (await this.prisma.theater.findFirst()) ||
          (await this.prisma.theater.create({
            data: {
              name: "Main Theater",
              slug: `theater-${Date.now().toString(36)}`,
              cityId: city.id,
              address: "City Center",
            },
          }));
        screen = await this.prisma.screen.create({
          data: { name: "Auditorium 1", theaterId: theater.id, totalSeats: 100 },
        });
      }
      show = await this.prisma.show.create({
        data: {
          movieId: data.movieId,
          screenId: screen.id,
          startTime: new Date(),
          endTime: new Date(Date.now() + 2 * 3600 * 1000),
          status: "OPEN",
        },
      });
    }

    const booking = await this.prisma.booking.create({
      data: {
        bookingNumber: `BMS-${ticketNumber}`,
        userId: data.userId,
        showId: show.id,
        status: "CONFIRMED",
        totalAmount: Number(data.amount),
        subtotal: Number(data.amount),
        currency: "INR",
      },
    });

    const ticket = await this.prisma.ticket.create({
      data: {
        bookingId: booking.id,
        ticketNumber,
        qrCodePayload: JSON.stringify({
          ticketNumber,
          movieId: data.movieId,
          userId: data.userId,
          seats: data.seats,
          amount: data.amount,
          paymentStatus: data.paymentStatus || "success",
        }),
        seatCount: data.seats.length,
        status: "ACTIVE",
      },
      include: {
        booking: {
          include: { show: true },
        },
      },
    });

    return {
      message: "ticket generate successfully",
      ticket: this.mapTicket(ticket),
      status: 201,
    };
  }
}
