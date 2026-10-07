import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
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
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException("Invalid show start or end time format");
    }

    if (startTime >= endTime) {
      throw new BadRequestException("Show start time must be before end time");
    }

    // Section 121: Prevent Screen Schedule Conflicts
    // Validate overlapping intervals before creating a show on this screen.
    const conflict = await this.prisma.show.findFirst({
      where: {
        screenId: data.screenId,
        status: { not: "CANCELLED" },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      include: { movie: true },
    });

    if (conflict) {
      throw new ConflictException(
        `Screen schedule conflict (Section 121): Screen is already booked for "${conflict.movie?.title || "another show"}" during this time window (${new Date(conflict.startTime).toISOString()} - ${new Date(conflict.endTime).toISOString()}).`
      );
    }

    // Section 122: Transactional Show & ShowSeat Generation
    const createdShowId = await this.prisma.$transaction(async (tx) => {
      const show = await tx.show.create({
        data: {
          movieId: data.movieId,
          screenId: data.screenId,
          startTime,
          endTime,
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

      const screenSeats = await tx.seat.findMany({
        where: { screenId: data.screenId },
      });

      if (screenSeats.length > 0) {
        await tx.showSeat.createMany({
          data: screenSeats.map((seat) => ({
            showId: show.id,
            seatId: seat.id,
            status: "AVAILABLE",
          })),
          skipDuplicates: true,
        });
      }

      return show.id;
    });

    return this.findOne(createdShowId);
  }

  /**
   * Section 13, 14, 16, 17: Returns theaters & showtimes for a movie in a specific city.
   * If no theaters/shows exist yet in that city, provisions authentic demonstration shows.
   */
  async getMovieTheatersAndShows(
    movieId: string,
    cityName = "Mumbai",
    dateStr?: string
  ) {
    const movie = await this.prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    // 1. Resolve City
    const citySlug = cityName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    let city = await this.prisma.city.findFirst({
      where: {
        OR: [
          { slug: { equals: citySlug, mode: "insensitive" } },
          { name: { equals: cityName, mode: "insensitive" } },
        ],
      },
    });

    if (!city) {
      city = await this.prisma.city.create({
        data: {
          name: cityName,
          slug: citySlug,
          country: "India",
        },
      });
    }

    // 2. Ensure at least 2 multiplexes exist in this city
    let theaters = await this.prisma.theater.findMany({
      where: { cityId: city.id },
      include: {
        screens: {
          include: {
            seats: true,
          },
        },
      },
    });

    if (theaters.length === 0) {
      const multiplex1 = await this.prisma.theater.create({
        data: {
          name: `PVR INOX: Phoenix Mall, ${cityName}`,
          slug: `pvr-phoenix-${citySlug}`,
          cityId: city.id,
          address: `Level 3, Phoenix Marketcity, ${cityName}`,
          amenities: ["IMAX", "Dolby Atmos", "Recliner", "Parking", "Food Court"],
        },
      });

      const multiplex2 = await this.prisma.theater.create({
        data: {
          name: `Cinepolis: Grand Central, ${cityName}`,
          slug: `cinepolis-grand-${citySlug}`,
          cityId: city.id,
          address: `Mall of India Sector 18, ${cityName}`,
          amenities: ["4DX", "Dolby Atmos", "Recliner", "Wheelchair Access"],
        },
      });

      // Create screens for multiplex 1
      const screen1A = await this.prisma.screen.create({
        data: {
          theaterId: multiplex1.id,
          name: "Screen 1 - IMAX Laser",
          screenType: "IMAX",
          totalSeats: 56,
        },
      });

      const screen1B = await this.prisma.screen.create({
        data: {
          theaterId: multiplex1.id,
          name: "Screen 2 - Dolby Atmos",
          screenType: "DOLBY",
          totalSeats: 56,
        },
      });

      // Create screens for multiplex 2
      const screen2A = await this.prisma.screen.create({
        data: {
          theaterId: multiplex2.id,
          name: "Audi 1 - 4DX Dynamic",
          screenType: "4DX",
          totalSeats: 56,
        },
      });

      // Seed physical seat layouts for each screen
      for (const scr of [screen1A, screen1B, screen2A]) {
        await this.seedPhysicalSeats(scr.id);
      }

      theaters = await this.prisma.theater.findMany({
        where: { cityId: city.id },
        include: {
          screens: {
            include: {
              seats: true,
            },
          },
        },
      });
    }

    // 3. Resolve Date range
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 4. Fetch shows for this movie across these theaters
    const screenIds = theaters.flatMap((t) => t.screens.map((s) => s.id));
    let shows = await this.prisma.show.findMany({
      where: {
        movieId,
        screenId: { in: screenIds },
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        screen: {
          include: { theater: true },
        },
        showPrices: true,
      },
      orderBy: { startTime: "asc" },
    });

    // 5. If no shows exist for this movie on this date, seed demonstration shows
    if (shows.length === 0) {
      for (const theater of theaters) {
        for (const screen of theater.screens) {
          // Ensure screen has seats
          if (screen.seats.length === 0) {
            await this.seedPhysicalSeats(screen.id);
          }

          // Showtimes: 10:30 AM, 02:15 PM, 06:00 PM, 09:30 PM
          const hours = [10.5, 14.25, 18.0, 21.5];
          for (const hour of hours) {
            const showStart = new Date(startOfDay);
            const wholeHours = Math.floor(hour);
            const minutes = Math.round((hour - wholeHours) * 60);
            showStart.setHours(wholeHours, minutes, 0, 0);

            const showEnd = new Date(showStart.getTime() + (movie.durationMinutes || 120) * 60 * 1000);

            await this.create({
              movieId,
              screenId: screen.id,
              startTime: showStart,
              endTime: showEnd,
              prices: [
                { tier: "Recliner", price: 550 },
                { tier: "Platinum", price: 450 },
                { tier: "Gold", price: 320 },
                { tier: "Silver", price: 220 },
              ],
            });
          }
        }
      }

      shows = await this.prisma.show.findMany({
        where: {
          movieId,
          screenId: { in: screenIds },
          startTime: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          screen: {
            include: { theater: true },
          },
          showPrices: true,
        },
        orderBy: { startTime: "asc" },
      });
    }

    // 6. Group shows by Theater
    const theaterMap = new Map<string, any>();
    for (const theater of theaters) {
      theaterMap.set(theater.id, {
        id: theater.id,
        name: theater.name,
        address: theater.address,
        amenities: theater.amenities,
        shows: [],
      });
    }

    for (const show of shows) {
      const theaterId = show.screen.theaterId;
      if (theaterMap.has(theaterId)) {
        theaterMap.get(theaterId).shows.push({
          id: show.id,
          startTime: show.startTime,
          endTime: show.endTime,
          screenName: show.screen.name,
          screenType: show.screen.screenType,
          prices: show.showPrices.map((p) => ({ tier: p.tier, price: p.price })),
        });
      }
    }

    return {
      movie: {
        id: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
        durationMinutes: movie.durationMinutes,
        language: movie.language,
        certification: movie.certification,
      },
      city: city.name,
      date: startOfDay.toISOString(),
      theaters: Array.from(theaterMap.values()).filter((t) => t.shows.length > 0),
      status: 200,
    };
  }

  /**
   * Section 15, 17, 18, 19: Returns physical seats and real ShowSeat inventory for a specific show.
   */
  async getShowSeats(showId: string) {
    const show = await this.prisma.show.findUnique({
      where: { id: showId },
      include: {
        movie: true,
        screen: {
          include: {
            theater: true,
            seats: {
              orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
            },
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
      throw new NotFoundException(`Show with ID ${showId} not found`);
    }

    let showSeats = show.showSeats;
    // If showSeats are missing for any physical seat, provision them
    if (showSeats.length === 0 && show.screen.seats.length > 0) {
      await this.prisma.showSeat.createMany({
        data: show.screen.seats.map((seat) => ({
          showId: show.id,
          seatId: seat.id,
          status: "AVAILABLE",
        })),
        skipDuplicates: true,
      });

      showSeats = await this.prisma.showSeat.findMany({
        where: { showId },
        include: { seat: true },
      });
    }

    // Build price lookup map
    const priceMap = new Map<string, number>();
    for (const p of show.showPrices) {
      priceMap.set(p.tier.toLowerCase(), p.price);
    }

    // Default prices per tier if not configured
    const defaultPrices: Record<string, number> = {
      recliner: 550,
      platinum: 450,
      gold: 320,
      silver: 220,
    };

    const seats = showSeats.map((ss) => {
      const tierKey = (ss.seat.tier || "Silver").toLowerCase();
      const price = priceMap.get(tierKey) || defaultPrices[tierKey] || 250;

      return {
        showSeatId: ss.id,
        seatId: ss.seat.id,
        seatNumber: ss.seat.seatNumber,
        rowLabel: ss.seat.rowLabel,
        seatType: ss.seat.seatType,
        tier: ss.seat.tier,
        price,
        status: ss.status,
      };
    });

    return {
      show: {
        id: show.id,
        startTime: show.startTime,
        endTime: show.endTime,
        movie: {
          id: show.movie.id,
          title: show.movie.title,
          posterUrl: show.movie.posterUrl,
          durationMinutes: show.movie.durationMinutes,
          language: show.movie.language,
          certification: show.movie.certification,
        },
        screen: {
          id: show.screen.id,
          name: show.screen.name,
          screenType: show.screen.screenType,
        },
        theater: {
          id: show.screen.theater.id,
          name: show.screen.theater.name,
          address: show.screen.theater.address,
        },
      },
      prices: show.showPrices,
      seats,
      status: 200,
    };
  }

  /**
   * Helper: Seeds physical auditorium seats with 4 pricing tiers:
   * Row A: Recliner (8 seats)
   * Rows B, C: Platinum (16 seats)
   * Rows D, E: Gold (16 seats)
   * Rows F, G: Silver (16 seats)
   */
  private async seedPhysicalSeats(screenId: string) {
    const existing = await this.prisma.seat.count({ where: { screenId } });
    if (existing > 0) return;

    const rows = [
      { label: "A", tier: "Recliner", seatType: "RECLINER", count: 8 },
      { label: "B", tier: "Platinum", seatType: "PREMIUM", count: 8 },
      { label: "C", tier: "Platinum", seatType: "PREMIUM", count: 8 },
      { label: "D", tier: "Gold", seatType: "REGULAR", count: 8 },
      { label: "E", tier: "Gold", seatType: "REGULAR", count: 8 },
      { label: "F", tier: "Silver", seatType: "REGULAR", count: 8 },
      { label: "G", tier: "Silver", seatType: "REGULAR", count: 8 },
    ];

    const seatData = [];
    for (const r of rows) {
      for (let i = 1; i <= r.count; i++) {
        seatData.push({
          screenId,
          rowLabel: r.label,
          seatNumber: `${r.label}${i}`,
          seatType: r.seatType,
          tier: r.tier,
          xPosition: i,
          yPosition: r.label.charCodeAt(0) - 64,
        });
      }
    }

    await this.prisma.seat.createMany({
      data: seatData,
      skipDuplicates: true,
    });
  }
}
