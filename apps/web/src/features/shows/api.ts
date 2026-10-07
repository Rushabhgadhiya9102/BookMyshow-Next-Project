import apiInstance from "@/shared/lib/api-client";
import type { MovieTheatersResponse, ShowSeatsResponse } from "./types";

export interface CreateHoldResponse {
  message: string;
  bookingId: string;
  bookingNumber: string;
  holdToken: string;
  expiresAt: string;
  totalAmount: number;
}

export interface VerifyPaymentResponse {
  message?: string;
  booking?: Record<string, string | number | boolean>;
  ticket?: Record<string, string | number | boolean>;
}

export interface RequestRefundResponse {
  message: string;
  refund?: Record<string, string | number | boolean>;
  refundAmount?: number;
  bookingId?: string;
}

export const showsApi = {
  async getMovieTheatersAndShows(
    movieId: string,
    city = "Mumbai",
    date?: string
  ): Promise<MovieTheatersResponse> {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (date) params.set("date", date);

    const res = await apiInstance.get<MovieTheatersResponse>(
      `/api/v1/shows/movie/${movieId}?${params.toString()}`
    );
    return res.data;
  },

  async getShowSeats(showId: string): Promise<ShowSeatsResponse> {
    const res = await apiInstance.get<ShowSeatsResponse>(
      `/api/v1/shows/${showId}/seats`
    );
    return res.data;
  },
};

export const bookingsApi = {
  async createHold(data: {
    showId: string;
    seatIds: string[];
    userId: string;
    idempotencyKey?: string;
  }): Promise<CreateHoldResponse> {
    const headers: Record<string, string> = {};
    if (data.idempotencyKey) {
      headers["Idempotency-Key"] = data.idempotencyKey;
    }
    const res = await apiInstance.post<CreateHoldResponse>(
      "/api/v1/bookings/holds",
      data,
      { headers }
    );
    return res.data;
  },

  async releaseHold(bookingId: string, userId?: string): Promise<{ message: string }> {
    const res = await apiInstance.post<{ message: string }>(
      `/api/v1/bookings/holds/${bookingId}/release`,
      { userId }
    );
    return res.data;
  },

  async verifyPayment(data: {
    bookingId: string;
    sessionId?: string;
  }): Promise<VerifyPaymentResponse> {
    const res = await apiInstance.post<VerifyPaymentResponse>(
      "/api/v1/payments/verify",
      data
    );
    return res.data;
  },

  async requestRefund(data: {
    bookingId: string;
    reason?: string;
  }): Promise<RequestRefundResponse> {
    const res = await apiInstance.post<RequestRefundResponse>(
      `/api/v1/bookings/${data.bookingId}/refund`,
      { reason: data.reason }
    );
    return res.data;
  },
};

export interface VerifyTicketResponse {
  valid: boolean;
  message: string;
  ticketNumber: string;
  status: string;
  movieTitle: string;
  theaterName: string;
  screenName: string;
  startTime: string;
  seats: string[];
  seatCount: number;
  verifiedAt: string;
}

export const ticketsApi = {
  async verifyTicket(data: {
    ticketNumber?: string;
    qrPayload?: string;
  }): Promise<VerifyTicketResponse> {
    const res = await apiInstance.post<VerifyTicketResponse>(
      "/api/v1/tickets/verify",
      data
    );
    return res.data;
  },

  async getTicket(
    ticketNumber: string
  ): Promise<Record<string, string | number | boolean>> {
    const res = await apiInstance.get<Record<string, string | number | boolean>>(
      `/api/v1/tickets/${ticketNumber}`
    );
    return res.data;
  },
};
