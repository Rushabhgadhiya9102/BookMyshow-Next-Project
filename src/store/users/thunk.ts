import apiInstance from "@/configs/apiInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";

// ======================================================== //
// ======================= SIGN UP PROCESS ====================== //
// ======================================================== //

export const signUp = createAsyncThunk("user/created", async(user, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post('/api/authentication/signup', user)
        console.log(res.data);
        return res.data

    } catch (error) {
        const err = error as Error
        rejectWithValue(err.message);
    }

})

// ======================================================== //
// ======================= SIGN IN PROCESS ====================== //
// ======================================================== //

export const login = createAsyncThunk("user/loggedIn", async(user, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post('/api/authentication/login', user)
        console.log(res.data);
        return res.data

    } catch (error) {
        const err = error as Error
        rejectWithValue(err.message);
    }

})

// ======================================================== //
// ======================= LOGOUT PROCESS ====================== //
// ======================================================== //

export const logout = createAsyncThunk("user/loggedOut", async(_, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.get('/api/authentication/logout')
        console.log(res.data);
        return res.data

    } catch (error) {
        const err = error as Error
        rejectWithValue(err.message);

    }

})

// ======================================================== //
// ======================= GET ONLY USERS ====================== //
// ======================================================== //

export const getOnlyUser = createAsyncThunk("user/getOnlyUser", async(_,{rejectWithValue})=>{

    try {
        
        const res = await apiInstance.get('/api/authentication/allUsers')
        return res.data.users

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message);
        
    }

})