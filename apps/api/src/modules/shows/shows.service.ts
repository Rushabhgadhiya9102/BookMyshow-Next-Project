import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ShowsService {
  constructor(private prisma: PrismaService) {}

  async findAll(movieId?: string, date?: string) {
    const where: any = {};
    if (movieId) where.movieId = movieId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    return this.prisma.show.findMany({
      where,
      include: {
        movie: true,
        screen: {
          include: {
            theater: true,
          },
        },
        showPrices: true,
      },
      orderBy: { startTime: "asc" },
    });
  }

  async findOne(id: string) {
    const show = await this.prisma.show.findUnique({
      where: { id },
      include: {
        movie: true,
        screen: {
          include: {
            theater: true,
            seats: true,
          },
        },
        showPrices: true,
        showSeats: {
          include: {
            seat: true,
          },
        },
      },
    });

    if (!show) {
      throw new NotFoundException(`Show with ID ${id} not found`);
    }

    return show;
  }

  async create(data: {
    movieId: string;
    screenId: string;
    startTime: string | Date;
    endTime: string | Date;
    prices: Array<{ tier: string; price: number }>;
  }) {
    const show = await this.prisma.show.create({
      data: {
        movieId: data.movieId,
        screenId: data.screenId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        status: "OPEN",
        showPrices: {
          create: data.prices.map((p) => ({
            tier: p.tier,
            price: p.price,
            currency: "INR",
          })),
        },
      },
    });

    const screenSeats = await this.prisma.seat.findMany({
      where: { screenId: data.screenId },
    });

    if (screenSeats.length > 0) {
      await this.prisma.showSeat.createMany({
        data: screenSeats.map((seat) => ({
          showId: show.id,
          seatId: seat.id,
          status: "AVAILABLE",
        })),
        skipDuplicates: true,
      });
    }

    return this.findOne(show.id);
  }
}
