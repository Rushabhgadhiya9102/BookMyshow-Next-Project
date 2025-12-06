import apiInstance from "@/configs/apiInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const createStripeSession = createAsyncThunk('payment/createStripeSession', async (stripeData:{amount:string, movieId:string, userId:string,  selectedSeats:string[]}, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post('/api/stripePay', stripeData)
        return res.data;

    } catch (error) {
        const err = error as Error;
        console.log(err.message);
        return rejectWithValue(err.message);
    }

})