import apiInstance from "@/shared/lib/api-client";
import type { StripeSessionPayload, StripeSessionResponse } from "@/features/payments/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const createStripeSession = createAsyncThunk<StripeSessionResponse, StripeSessionPayload, { rejectValue: string }>(
    'payment/createStripeSession',
    async (stripeData, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post<StripeSessionResponse>('/api/v1/payments/stripe-session', stripeData)
        return res.data;

    } catch (error) {
        const err = error as Error;
        console.log(err.message);
        return rejectWithValue(err.message);
    }

})
