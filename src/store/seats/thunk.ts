import apiInstance from "@/configs/apiInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getSeatsByMovieId = createAsyncThunk('fetch/seats', async (id:string, {rejectWithValue}) => {
    try {

    const res = await apiInstance.get(`/api/seats/${id}`);
    return res.data;

    } catch (error) {

        const err = error as Error;
        console.log(err.message);
        return rejectWithValue(err.message);

    }
})


export const postBookSeats = createAsyncThunk('post/seats', async (data: {id: string, userId: string, seats: string[]}, {rejectWithValue}) => {
    try {
        const res = await apiInstance.post(`/api/seats/${data.id}`, data)
        return res.data;
    }catch(error){

        const err = error as Error
        console.log(err.message);
        rejectWithValue(err.message)
    }

})