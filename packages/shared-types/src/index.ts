// ======================================================== //
// ============ BookMyShow Core Shared Domain Types ======= //
// ======================================================== //

export type UserRole = 'user' | 'admin';

export interface UserSummary {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthTokenPayload {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export type SeatTier = 'premium' | 'executive' | 'normal';

export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface MovieCastMember {
  name: string;
  role?: string;
  imageUrl?: string;
}

export interface MovieItem {
  id: string;
  title: string;
  synopsis?: string;
  genres: string[];
  language: string[];
  cinemas: string[];
  category: string;
  releaseDate?: string;
  runtime?: number;
  rating?: number;
  cast: MovieCastMember[];
  poster: string;
  banners: string;
  createdBy?: string;
}

export interface TheaterSummary {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface ScreenSummary {
  id: string;
  theaterId: string;
  name: string;
  totalSeats: number;
}

export interface ShowSummary {
  id: string;
  movieId: string;
  theaterId: string;
  screenId: string;
  startTime: string;
  endTime: string;
  date: string;
  pricing: Record<SeatTier, number>;
}

export interface ShowSeatInfo {
  seatNumber: string;
  tier: SeatTier;
  price: number;
  status: SeatStatus;
  lockedAt?: string;
}

export interface BookingSummary {
  id: string;
  userId: string;
  showId: string;
  seats: string[];
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
}

export interface TicketSummary {
  id: string;
  bookingId?: string;
  userId: string;
  movieId: string;
  showId?: string;
  seats: string[];
  seatCount: number;
  amount: number;
  paymentStatus: PaymentStatus | string;
  createdAt?: string;
}

export interface CommentItem {
  _id: string;
  userId: string;
  movieId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
}
