import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export interface DashboardMetrics {
  todayRevenue: number;
  todayBookings: number;
  ticketsSold: number;
  occupancyRate: number;
  activeShows: number;
  failedPayments: number;
  refundsCount: number;
  refundsAmount: number;
  registeredUsers: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalRevenue: number;
}

export interface RevenueAnalyticsPoint {
  day: string;
  bookings: number;
  revenue: number;
}

export interface OccupancyAnalyticsItem {
  showId: string;
  movieTitle: string;
  theaterName: string;
  screenName: string;
  startTime: Date;
  totalSeats: number;
  bookedSeats: number;
  occupancyPercentage: number;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Section 60: Admin Dashboard Server-Side Aggregated Metrics
   * Uses PostgreSQL aggregations instead of client-side filter() and reduce().
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Today's Revenue & Bookings (PostgreSQL aggregate)
    const [todayRevenueAgg, todayBookings] = await Promise.all([
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "CONFIRMED",
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.booking.count({
        where: {
          status: "CONFIRMED",
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    // 2. Tickets Sold (Total across all active & used tickets)
    const ticketsSoldAgg = await this.prisma.ticket.aggregate({
      _sum: { seatCount: true },
      where: {
        status: { in: ["ACTIVE", "USED"] },
      },
    });

    // 3. Active Shows (Currently scheduled/running)
    const activeShows = await this.prisma.show.count({
      where: {
        startTime: { lte: now },
        endTime: { gte: now },
        status: { not: "CANCELLED" },
      },
    });

    // 4. Failed Payments
    const failedPayments = await this.prisma.payment.count({
      where: {
        status: "FAILED",
      },
    });

    // 5. Refunds (Count & Sum)
    const refundsAgg = await this.prisma.refund.aggregate({
      _count: true,
      _sum: { amount: true },
      where: {
        status: "SUCCEEDED",
      },
    });

    // 6. Registered Users
    const registeredUsers = await this.prisma.user.count();

    // 7. Occupancy Rate (Aggregated over all show seats in the system)
    const [totalSeats, bookedSeats] = await Promise.all([
      this.prisma.showSeat.count(),
      this.prisma.showSeat.count({
        where: { status: "BOOKED" },
      }),
    ]);
    const occupancyRate = totalSeats > 0 ? Number(((bookedSeats / totalSeats) * 100).toFixed(1)) : 0;

    // 8. Weekly, Monthly, and Total Revenue
    const [weeklyRevenueAgg, monthlyRevenueAgg, totalRevenueAgg] = await Promise.all([
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "CONFIRMED",
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "CONFIRMED",
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: "CONFIRMED" },
      }),
    ]);

    return {
      todayRevenue: todayRevenueAgg._sum.totalAmount ?? 0,
      todayBookings,
      ticketsSold: ticketsSoldAgg._sum.seatCount ?? 0,
      occupancyRate,
      activeShows,
      failedPayments,
      refundsCount: refundsAgg._count ?? 0,
      refundsAmount: refundsAgg._sum.amount ?? 0,
      registeredUsers,
      weeklyRevenue: weeklyRevenueAgg._sum.totalAmount ?? 0,
      monthlyRevenue: monthlyRevenueAgg._sum.totalAmount ?? 0,
      totalRevenue: totalRevenueAgg._sum.totalAmount ?? 0,
    };
  }

  /**
   * Section 61: Analytics Queries
   * PostgreSQL aggregation using DATE_TRUNC, COUNT, SUM grouped by day.
   */
  async getRevenueAnalytics(days = 7): Promise<RevenueAnalyticsPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    try {
      const rawRows = await this.prisma.$queryRaw<Array<{ day: Date; bookings: number; revenue: number }>>`
        SELECT
          DATE_TRUNC('day', "createdAt") AS day,
          COUNT(*)::int AS bookings,
          COALESCE(SUM("totalAmount"), 0)::float AS revenue
        FROM "bookings"
        WHERE "createdAt" >= ${startDate} AND "status" = 'CONFIRMED'
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY day ASC
      `;

      return rawRows.map((r) => ({
        day: r.day instanceof Date ? r.day.toISOString().split("T")[0] : String(r.day).split("T")[0],
        bookings: Number(r.bookings) || 0,
        revenue: Number(r.revenue) || 0,
      }));
    } catch (err) {
      this.logger.warn(`Fallback to Prisma findMany aggregation: ${err}`);
      // Fallback query if running on engine without DATE_TRUNC support
      const bookings = await this.prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
      });

      const dayMap = new Map<string, { bookings: number; revenue: number }>();
      for (const b of bookings) {
        const key = b.createdAt.toISOString().split("T")[0];
        const existing = dayMap.get(key) || { bookings: 0, revenue: 0 };
        existing.bookings += 1;
        existing.revenue += b.totalAmount;
        dayMap.set(key, existing);
      }

      return Array.from(dayMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, val]) => ({
          day,
          bookings: val.bookings,
          revenue: val.revenue,
        }));
    }
  }

  /**
   * Section 61 & 62: Occupancy Analytics across Shows & Screens
   */
  async getOccupancyAnalytics(): Promise<OccupancyAnalyticsItem[]> {
    const shows = await this.prisma.show.findMany({
      where: {
        startTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        movie: { select: { id: true, title: true } },
        screen: {
          select: {
            id: true,
            name: true,
            theater: { select: { id: true, name: true, city: true } },
          },
        },
        showSeats: { select: { status: true } },
      },
      orderBy: { startTime: "desc" },
      take: 20,
    });

    return shows.map((show) => {
      const total = show.showSeats.length;
      const booked = show.showSeats.filter((s) => s.status === "BOOKED").length;
      return {
        showId: show.id,
        movieTitle: show.movie.title,
        theaterName: show.screen.theater.name,
        screenName: show.screen.name,
        startTime: show.startTime,
        totalSeats: total,
        bookedSeats: booked,
        occupancyPercentage: total > 0 ? Number(((booked / total) * 100).toFixed(1)) : 0,
      };
    });
  }
}
