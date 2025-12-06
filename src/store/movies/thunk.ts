import apiInstance from "@/configs/apiInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";

// ======================================================== //
// ======================= ADD MOVIES ====================== //
// ======================================================== //

export const addMovie = createAsyncThunk<any>("movie/addMovie", async (movie, { rejectWithValue }) => {

    try {

        const res = await apiInstance.post('/api/movies', movie)
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

        const res = await apiInstance.post('/api/upload', formData, {
            headers: { "Content-Type": "multipart/form-data" }
        })
        return res.data.url

    } catch (error: any) {
        console.log("error an occur in image upload");
        throw new Error(error.response?.data?.error?.message || "failed to upload image")

    }
}

// ======================================================== //
// ======================= GET MOVIES ====================== //
// ======================================================== //

export const getmovie = createAsyncThunk<any>("movie/fetch", async (_, { rejectWithValue }) => {

    try {

        const res = await apiInstance.get('/api/movies')
        return res.data.movieData

    } catch (error) {
        const err = error as Error
        rejectWithValue(err.message)
    }

})

// ======================================================== //
// ======================= GET MOVIES BY ID ====================== //
// ======================================================== //

export const getmovieById = createAsyncThunk<any, string>("movie/fetchbyId", async (_id, { rejectWithValue }) => {

    try {

        const res = await apiInstance.get(`/api/movies/${_id}`)
        return res.data.movieById

    } catch (error) {
        const err = error as Error
        rejectWithValue(err.message)
    }

})

// ======================================================== //
// ======================= DELETE MOVIES ====================== //
// ======================================================== //

export const deleteMovie = createAsyncThunk<any, string>("movie/delete", async (id, { rejectWithValue }) => {

    try {

        await apiInstance.delete(`/api/movies/${id}`)
        return id

    } catch (error) {
        const err = error as Error
        rejectWithValue(err.message)
    }

})

// ======================================================== //
// ======================= UPDATE MOVIES ====================== //
// ======================================================== //

export const updateMovie = createAsyncThunk<any, any>("movie/update", async (movie, { rejectWithValue }) => {

    try {

        const { _id } = movie
        const res = await apiInstance.patch(`/api/movies/${_id}`, movie)
        return res.data.updatedData

    } catch (error) {
        const err = error as Error
        rejectWithValue(err.message)

    }

})