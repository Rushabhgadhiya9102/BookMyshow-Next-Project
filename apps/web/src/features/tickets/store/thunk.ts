import apiInstance from "@/shared/lib/api-client";
import type { CreateTicketPayload, Ticket } from "@/features/tickets/types";
import { createAsyncThunk } from "@reduxjs/toolkit";



export const createTicket = createAsyncThunk<Ticket, CreateTicketPayload, { rejectValue: string }>(
    'ticket/create',
    async(ticket, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post<{ ticket: Ticket }>('/api/v1/tickets', ticket)
        return res.data.ticket

    } catch (error) {

        const err = error as Error 
        console.log(err.message);
        return rejectWithValue(err.message)

    }

})

export const getTickets = createAsyncThunk<Ticket[], void, { rejectValue: string }>(
    'ticket/fetch',
    async(_,{rejectWithValue})=>{

    try {
        
        const res = await apiInstance.get<{ tickets: Ticket[] }>('/api/v1/tickets')
        return res.data.tickets

    } catch (error) {

        const err = error as Error
        console.log(err.message);
        return rejectWithValue(err.message)
        
    }

})
