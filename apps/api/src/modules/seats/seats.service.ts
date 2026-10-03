import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class SeatsService {
  constructor(private prisma: PrismaService) {}

  async getSeatsByMovieId(movieId: string) {
    const showSeats = await this.prisma.showSeat.findMany({
      where: {
        show: { movieId },
        status: { in: ["HELD", "BOOKED"] },
      },
      include: {
        seat: true,
      },
    });

    const seatByMovieId = showSeats.map((ss) => ({
      _id: ss.id,
      id: ss.id,
      movieId,
      seatNumber: ss.seat?.seatNumber || ss.seatId,
      bookedBy: ss.heldBy || "booked",
      createdAt: ss.createdAt.toISOString(),
      updatedAt: ss.updatedAt.toISOString(),
    }));

    return {
      message: "seat fetch sucessfull",
      seatByMovieId,
      status: 200,
    };
  }

  async bookSeats(movieId: string, userId: string, seats: string[]) {
    let show = await this.prisma.show.findFirst({
      where: { movieId },
      include: { screen: true },
    });

    if (!show) {
      let city = await this.prisma.city.findFirst();
      if (!city) {
        city = await this.prisma.city.create({
          data: { name: "Default City", slug: `city-${Date.now().toString(36)}` },
        });
      }

      let theater = await this.prisma.theater.findFirst({ where: { cityId: city.id } });
      if (!theater) {
        theater = await this.prisma.theater.create({
          data: {
            name: "Main Multiplex",
            slug: `theater-${Date.now().toString(36)}`,
            cityId: city.id,
            address: "Main Street Cinema",
          },
        });
      }

      let screen = await this.prisma.screen.findFirst({ where: { theaterId: theater.id } });
      if (!screen) {
        screen = await this.prisma.screen.create({
          data: {
            name: "Screen 1",
            theaterId: theater.id,
            totalSeats: 100,
          },
        });
      }

      show = await this.prisma.show.create({
        data: {
          movieId,
          screenId: screen.id,
          startTime: new Date(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: "OPEN",
        },
        include: { screen: true },
      });
    }

    const bookedEntries = [];

    for (const seatNumber of seats) {
      let seat = await this.prisma.seat.findFirst({
        where: { screenId: show.screenId, seatNumber },
      });

      if (!seat) {
        seat = await this.prisma.seat.create({
          data: {
            screenId: show.screenId,
            rowLabel: seatNumber.charAt(0) || "A",
            seatNumber,
            seatType: "REGULAR",
            tier: "Silver",
          },
        });
      }

      const showSeat = await this.prisma.showSeat.upsert({
        where: {
          showId_seatId: {
            showId: show.id,
            seatId: seat.id,
          },
        },
        update: {
          status: "BOOKED",
          heldBy: userId,
          bookedAt: new Date(),
        },
        create: {
          showId: show.id,
          seatId: seat.id,
          status: "BOOKED",
          heldBy: userId,
          bookedAt: new Date(),
        },
      });

      bookedEntries.push({
        _id: showSeat.id,
        id: showSeat.id,
        movieId,
        seatNumber,
        bookedBy: userId,
        createdAt: showSeat.createdAt.toISOString(),
        updatedAt: showSeat.updatedAt.toISOString(),
      });
    }

    return {
      message: "seats booked successfully",
      booked: bookedEntries,
    };
  }
}
