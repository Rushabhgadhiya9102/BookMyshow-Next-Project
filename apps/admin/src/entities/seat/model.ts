import mongoose from "mongoose";

const bookedSeatSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MovieData",
        required: true
    },

    seatNumber: {
        type: String,
        required: true
    },

    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserData",
        required: true
    }
}, { timestamps: true });

const SeatData = mongoose.models.SeatData ||
    mongoose.model("SeatData", bookedSeatSchema);

export default SeatData;
