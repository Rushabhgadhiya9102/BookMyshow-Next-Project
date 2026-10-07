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
  id?: string;
  title: string;
  slug?: string;
  synopsis?: string;
  description?: string;
  genres: string[];
  language: string[] | string;
  cinemas: string[];
  category: MovieCategory;
  releaseDate?: string;
  runtime?: number;
  durationMinutes?: number;
  rating?: number;
  status?: string;
  certification?: string;
  cast: MovieCastMember[];
  poster: string;
  posterUrl?: string;
  banners: string;
  backdropUrl?: string;
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
