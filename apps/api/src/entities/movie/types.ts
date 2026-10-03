import type { SafeUser } from "@/entities/user/types";

export type MovieCategory = "Movie" | "Streams" | "Sports" | "Events" | "Plays" | "Activities";

export interface MovieCastMember {
  name: string;
  role: string;
  imageUrl: string;
}

export interface MovieCastFormMember {
  name: string;
  role: string;
  imageUrl: string | File;
}

export type MovieCreator =
  | string
  | (Pick<SafeUser, "_id" | "username" | "email"> & {
      name?: string;
    });

export interface Movie {
  _id: string;
  title: string;
  synopsis?: string;
  genres: string[];
  language: string[];
  cinemas: string[];
  category: MovieCategory;
  releaseDate?: string;
  runtime?: number;
  rating?: number;
  cast: MovieCastMember[];
  poster: string;
  banners: string;
  createdBy: MovieCreator;
  createdAt?: string;
  updatedAt?: string;
}

export interface MoviePayload {
  title: string;
  synopsis?: string;
  genres: string[];
  language: string[];
  cinemas: string[];
  category: MovieCategory;
  releaseDate?: string;
  runtime?: number;
  rating?: number;
  cast: MovieCastMember[];
  poster: string;
  banners: string;
}

export interface MovieUpdatePayload extends MoviePayload {
  _id: string;
}

export interface MovieFormValues {
  _id?: string;
  title: string;
  synopsis: string;
  genres: string[];
  language: string[];
  cinemas: string[];
  category: MovieCategory | "";
  releaseDate: string;
  runtime: number | "";
  rating: number | "";
  cast: MovieCastFormMember[];
  poster: string;
  banners: string;
}
