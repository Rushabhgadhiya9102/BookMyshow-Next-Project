import apiInstance from "@/shared/lib/api-client";
import type { BookSeatsPayload, BookSeatsResponse, GetSeatsResponse } from "@/features/seats/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getSeatsByMovieId = createAsyncThunk<GetSeatsResponse, string, { rejectValue: string }>(
    'fetch/seats',
    async (id, {rejectWithValue}) => {
    try {

    const res = await apiInstance.get<GetSeatsResponse>(`/api/v1/seats/${id}`);
    return res.data;

    } catch (error) {

        const err = error as Error;
        console.log(err.message);
        return rejectWithValue(err.message);

    }
})


export const postBookSeats = createAsyncThunk<BookSeatsResponse, BookSeatsPayload, { rejectValue: string }>(
    'post/seats',
    async (data, {rejectWithValue}) => {
    try {
        const res = await apiInstance.post<BookSeatsResponse>(`/api/v1/seats/${data.id}`, data)
        return res.data;
    }catch(error){

        const err = error as Error
        console.log(err.message);
        return rejectWithValue(err.message)
    }

})
