export interface Comment {
  _id: string;
  userId: string;
  movieId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentPayload {
  movieId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
}

export interface UpdateCommentPayload extends CommentPayload {
  _id: string;
}
