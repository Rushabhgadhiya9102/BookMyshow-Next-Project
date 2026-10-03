import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: "MovieData", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserData", required: true },
  seats: { type: [String], required: true },
  seatCount: { type: Number, required: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, default: "success" },
  
},{
    timestamps:true
});

const TicketData = mongoose.models.TicketData || mongoose.model("TicketData", TicketSchema);
export default TicketData
