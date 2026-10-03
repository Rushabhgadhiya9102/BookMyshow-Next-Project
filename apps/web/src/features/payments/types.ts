export interface StripeSessionPayload {
  amount: string;
  movieId: string;
  userId: string;
  selectedSeats: string[];
}

export interface StripeSessionResponse {
  url: string | null;
}
