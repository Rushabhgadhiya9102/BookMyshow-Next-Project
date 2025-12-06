import { createSlice } from "@reduxjs/toolkit";
import { createStripeSession } from "./thunk";

interface StripeState {
    sessionUrl: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: StripeState = {
    sessionUrl: null,
    loading: false,
    error: null,
};

const stripeSlice = createSlice({

    name:"payments",
    initialState,
    reducers:{},
    extraReducers:(builder)=>{

        builder.addCase(createStripeSession.pending, (state)=>{
            state.loading = true;
            state.error = null;
        })

        builder.addCase(createStripeSession.fulfilled, (state, action)=>{
            state.loading = false;
            state.sessionUrl = action.payload.url;
            state.error = null;
        })

        builder.addCase(createStripeSession.rejected, (state, action)=>{
            state.loading = false;
            state.error = action.payload as string;
        })
    }

})

export default stripeSlice.reducer;