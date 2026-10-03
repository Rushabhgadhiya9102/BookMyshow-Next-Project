export interface Ticket {
  _id: string;
  movieId: string;
  userId: string;
  seats: string[];
  seatCount: number;
  amount: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketPayload {
  movieId: string;
  userId: string;
  seats: string[];
  amount: number;
  paymentStatus?: string;
}
