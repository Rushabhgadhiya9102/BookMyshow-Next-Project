import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getSeatsByMovieId, postBookSeats } from "./thunk";

type SeatsState = {
    bookedSeats: string[];
    selectedSeats: string[];
    loading: boolean;
    price: number;
};

const initialState:SeatsState = {

    bookedSeats: [],
    selectedSeats: [],
    loading:false,
    price: 0,

}

const seatsSlice = createSlice({

    name:"seats",
    initialState,
    reducers:{

        toggleSeat: (state, action: PayloadAction<string>) => {
            if (state.selectedSeats.includes(action.payload)) {
                state.selectedSeats = state.selectedSeats.filter(s => s !== action.payload);
            } else {
                state.selectedSeats.push(action.payload);
            }
        },

        resetSelectedSeats: (state) => {
            state.selectedSeats = [];
            state.price = 0;
        }

    },

    extraReducers: (builder)=>{

        builder.addCase(getSeatsByMovieId.pending, (state)=>{
            state.loading = true
        })
        
        builder.addCase(getSeatsByMovieId.fulfilled, (state,action)=>{
            state.loading = false
            state.bookedSeats = action.payload.seatByMovieId
        })

        builder.addCase(postBookSeats.pending, (state)=>{
            state.loading = true
        })

        builder.addCase(postBookSeats.fulfilled, (state,action)=>{
            state.loading = false
            state.bookedSeats.push(...action.payload.booked)
            state.selectedSeats = []
    
        })


    }

})

export const { toggleSeat, resetSelectedSeats } = seatsSlice.actions;
export default seatsSlice.reducer;