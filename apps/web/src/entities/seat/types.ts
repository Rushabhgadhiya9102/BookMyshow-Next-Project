export type SeatType = "premium" | "executive" | "normal";

export interface SeatBooking {
  _id: string;
  movieId: string;
  seatNumber: string;
  bookedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookSeatsPayload {
  id: string;
  userId: string;
  seats: string[];
}

export interface GetSeatsResponse {
  message: string;
  seatByMovieId: SeatBooking[];
  status: number;
}

export interface BookSeatsResponse {
  message: string;
  booked: SeatBooking[];
}
