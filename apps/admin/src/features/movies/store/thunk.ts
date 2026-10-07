import apiInstance from "@/shared/lib/api-client";
import type { Movie, MoviePayload, MovieUpdatePayload } from "@/features/movies/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ======================================================== //
// ======================= ADD MOVIES ====================== //
// ======================================================== //

export const addMovie = createAsyncThunk<Movie, MoviePayload, { rejectValue: string }>(
    "movie/addMovie",
    async (movie, { rejectWithValue }) => {

    try {

        const res = await apiInstance.post<{ movie: Movie }>('/api/v1/movies', movie)
        return res.data.movie

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message);
    }

})

// ======================================================== //
// ======================= IMAGES UPLOADS ====================== //
// ======================================================== //

export const imageUpload = async (file: File): Promise<string> => {

    try {

        const formData = new FormData()
        formData.append("file", file)

        const res = await apiInstance.post<{ url: string }>('/api/v1/uploads', formData, {
            headers: { "Content-Type": undefined }
        })
        return res.data.url

    } catch (error) {
        console.error("Error in image upload:", error);
        if (axios.isAxiosError<{ error?: string; message?: string | string[] }>(error)) {
            const raw = error.response?.data?.message || error.response?.data?.error || error.message;
            const msg = Array.isArray(raw) ? raw.join(", ") : raw;
            throw new Error(msg || "failed to upload image");
        }

        if (error instanceof Error) {
            throw new Error(error.message);
        }

        throw new Error("failed to upload image");
    }
}

// ======================================================== //
// ======================= GET MOVIES ====================== //
// ======================================================== //

export const getmovie = createAsyncThunk<Movie[], void, { rejectValue: string }>(
    "movie/fetch",
    async (_, { rejectWithValue }) => {

    try {

        const res = await apiInstance.get<{ movieData: Movie[] }>('/api/v1/movies')
        return res.data.movieData

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message)
    }

})

// ======================================================== //
// ======================= GET MOVIES BY ID ====================== //
// ======================================================== //

export const getmovieById = createAsyncThunk<Movie, string, { rejectValue: string }>(
    "movie/fetchbyId",
    async (_id, { rejectWithValue }) => {

    try {

        const res = await apiInstance.get<{ movieById: Movie }>(`/api/v1/movies/${_id}`)
        return res.data.movieById

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message)
    }

})

// ======================================================== //
// ======================= DELETE MOVIES ====================== //
// ======================================================== //

export const deleteMovie = createAsyncThunk<string, string, { rejectValue: string }>(
    "movie/delete",
    async (id, { rejectWithValue }) => {

    try {

        await apiInstance.delete(`/api/v1/movies/${id}`)
        return id

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message)
    }

})

// ======================================================== //
// ======================= UPDATE MOVIES ====================== //
// ======================================================== //

export const updateMovie = createAsyncThunk<Movie, MovieUpdatePayload, { rejectValue: string }>(
    "movie/update",
    async (movie, { rejectWithValue }) => {

    try {

        const { _id } = movie
        const res = await apiInstance.patch<{ updatedData: Movie }>(`/api/v1/movies/${_id}`, movie)
        return res.data.updatedData

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message)

    }

})
