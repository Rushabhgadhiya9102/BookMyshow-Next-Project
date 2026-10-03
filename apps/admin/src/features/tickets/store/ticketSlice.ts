import type { Ticket } from "@/features/tickets/types";
import { createSlice } from "@reduxjs/toolkit";
import { createTicket, getTickets } from "./thunk";

interface TicketState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
}

const initialState: TicketState = {
  tickets: [],
  loading: false,
  error: null,
};

const ticketSlice = createSlice({

    name: "tickets",
    initialState,
    reducers:{},
    extraReducers: (builder)=>{

        // ======================================================== //
        // ======================= CREATE TICKETS ====================== //
        // ======================================================== //

        builder.addCase(createTicket.pending, (state) => {
        state.loading = true;
        });

        builder.addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.push(action.payload);
        });
        
        builder.addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error creating ticket";
        });

        // ======================================================== //
        // ======================= GET TICKETS ====================== //
        // ======================================================== //

        builder.addCase(getTickets.pending, (state)=>{
            state.loading = true
        })

        builder.addCase(getTickets.fulfilled, (state, action)=>{
            state.loading = false
            state.tickets = action.payload
        })

        builder.addCase(getTickets.rejected, (state, action)=>{
            state.loading = false
            state.error = action.error.message as string
        })

    }

})

export default ticketSlice.reducer
