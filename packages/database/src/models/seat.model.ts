import mongoose from "mongoose";

export interface ISeat {
  movieId: mongoose.Schema.Types.ObjectId;
  seatNumber: string;
  bookedBy: mongoose.Schema.Types.ObjectId;
}

const bookedSeatSchema = new mongoose.Schema<ISeat>(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MovieData",
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserData",
      required: true,
    },
  },
  { timestamps: true }
);

bookedSeatSchema.index({ movieId: 1, seatNumber: 1 }, { unique: true });

export const SeatData = mongoose.models.SeatData || mongoose.model<ISeat>("SeatData", bookedSeatSchema);
export default SeatData;
