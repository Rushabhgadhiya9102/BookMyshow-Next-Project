import mongoose from "mongoose";

export interface ITicket {
  movieId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  seats: string[];
  seatCount: number;
  amount: number;
  paymentStatus: string;
}

const ticketSchema = new mongoose.Schema<ITicket>(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MovieData",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserData",
      required: true,
    },
    seats: {
      type: [String],
      required: true,
    },
    seatCount: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: "success",
    },
  },
  {
    timestamps: true,
  }
);

export const TicketData = mongoose.models.TicketData || mongoose.model<ITicket>("TicketData", ticketSchema);
export default TicketData;
