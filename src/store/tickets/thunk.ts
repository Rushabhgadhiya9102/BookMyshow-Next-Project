import apiInstance from "@/configs/apiInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";



export const createTicket = createAsyncThunk('ticket/create', async(ticket:any, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post('/api/tickets', ticket)
        return res.data.ticket

    } catch (error) {

        const err = error as Error 
        console.log(err.message);
        rejectWithValue(err.message)

    }

})

export const getTickets = createAsyncThunk('ticket/fetch', async(_,{rejectWithValue})=>{

    try {
        
        const res = await apiInstance.get('/api/tickets')
        return res.data.tickets

    } catch (error) {

        const err = error as Error
        console.log(err.message);
        rejectWithValue(err.message)
        
    }

})