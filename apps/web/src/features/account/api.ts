import apiInstance from "@/shared/lib/api-client";
import type {
  BookingItem,
  ChangePasswordInput,
  SessionItem,
  UpdateProfileInput,
  UserProfile,
} from "./types";

export const accountApi = {
  async getProfile(): Promise<UserProfile> {
    const res = await apiInstance.get<{ user: UserProfile; status: number }>(
      "/api/v1/account/profile"
    );
    return res.data.user;
  },

  async updateProfile(
    data: UpdateProfileInput
  ): Promise<{ message: string; user: UserProfile }> {
    const res = await apiInstance.patch<{
      message: string;
      user: UserProfile;
      status: number;
    }>("/api/v1/account/profile", data);
    return res.data;
  },

  async changePassword(
    data: ChangePasswordInput
  ): Promise<{ message: string }> {
    const res = await apiInstance.post<{ message: string; status: number }>(
      "/api/v1/account/change-password",
      data
    );
    return res.data;
  },

  async getActiveSessions(): Promise<SessionItem[]> {
    const res = await apiInstance.get<{
      sessions: SessionItem[];
      status: number;
    }>("/api/v1/account/sessions");
    return res.data.sessions || [];
  },

  async revokeSession(sessionId: string): Promise<{ message: string }> {
    const res = await apiInstance.delete<{ message: string; status: number }>(
      `/api/v1/account/sessions/${sessionId}`
    );
    return res.data;
  },

  async logoutAllDevices(): Promise<{ message: string }> {
    const res = await apiInstance.post<{ message: string; status: number }>(
      "/api/v1/auth/logout-all"
    );
    return res.data;
  },

  async getBookings(): Promise<BookingItem[]> {
    const res = await apiInstance.get<{
      bookings: BookingItem[];
      status: number;
    }>("/api/v1/account/bookings");
    return res.data.bookings || [];
  },
};
