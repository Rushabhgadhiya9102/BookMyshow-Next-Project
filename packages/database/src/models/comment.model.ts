import mongoose from "mongoose";

export interface IComment {
  userId: mongoose.Schema.Types.ObjectId;
  movieId: mongoose.Schema.Types.ObjectId;
  username: string;
  rating: number;
  comment: string;
}

const commentSchema = new mongoose.Schema<IComment>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserData",
      required: true,
    },
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MovieData",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CommentData = mongoose.models.CommentData || mongoose.model<IComment>("CommentData", commentSchema);
export default CommentData;
