import type { Comment, CommentPayload, UpdateCommentPayload } from "@/entities/comment/types";

export interface CommentFormState {
  comment: string;
  rating: string;
}

export type { Comment, CommentPayload, UpdateCommentPayload };
