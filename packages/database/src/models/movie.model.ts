import mongoose from "mongoose";

export interface IMovie {
  title: string;
  synopsis?: string;
  genres: string[];
  language: string[];
  cinemas: string[];
  category: string;
  releaseDate?: Date;
  runtime?: number;
  rating?: number;
  cast: { name: string; role?: string; imageUrl?: string }[];
  poster: string;
  banners: string;
  createdBy: mongoose.Schema.Types.ObjectId;
}

const movieSchema = new mongoose.Schema<IMovie>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    synopsis: String,
    genres: [String],
    language: [String],
    cinemas: [String],
    category: String,
    releaseDate: Date,
    runtime: Number,
    rating: Number,
    cast: [{ name: String, role: String, imageUrl: String }],
    poster: String,
    banners: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserData",
    },
  },
  {
    timestamps: true,
  }
);

export const MovieData = mongoose.models.MovieData || mongoose.model<IMovie>('MovieData', movieSchema);
export default MovieData;
