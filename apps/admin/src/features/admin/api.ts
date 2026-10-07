import apiInstance from "@/shared/lib/api-client";

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
  startTime: string;
  totalSeats: number;
  bookedSeats: number;
  occupancyPercentage: number;
}

export const adminApi = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const res = await apiInstance.get<{ success: boolean; data: DashboardMetrics }>(
      "/api/v1/admin/dashboard/metrics"
    );
    return res.data.data;
  },

  getRevenueAnalytics: async (days = 7): Promise<RevenueAnalyticsPoint[]> => {
    const res = await apiInstance.get<{ success: boolean; data: RevenueAnalyticsPoint[] }>(
      `/api/v1/admin/analytics/revenue?days=${days}`
    );
    return res.data.data;
  },

  getOccupancyAnalytics: async (): Promise<OccupancyAnalyticsItem[]> => {
    const res = await apiInstance.get<{ success: boolean; data: OccupancyAnalyticsItem[] }>(
      "/api/v1/admin/analytics/occupancy"
    );
    return res.data.data;
  },
};
