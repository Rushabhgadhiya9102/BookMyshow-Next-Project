import apiInstance from "@/shared/lib/api-client";
import type { LoginFormValues, LoginResponse, LogoutResponse, SafeUser, SignupFormValues, SignupResponse } from "@/features/auth/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

// ======================================================== //
// ======================= SIGN UP PROCESS ====================== //
// ======================================================== //

export const signUp = createAsyncThunk<SignupResponse, SignupFormValues, { rejectValue: string }>(
    "user/created",
    async(user, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post<SignupResponse>('/api/v1/auth/signup', user)
        console.log(res.data);
        return res.data

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message);
    }

})

// ======================================================== //
// ======================= SIGN IN PROCESS ====================== //
// ======================================================== //

export const login = createAsyncThunk<LoginResponse, LoginFormValues, { rejectValue: string }>(
    "user/loggedIn",
    async(user, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post<LoginResponse>('/api/v1/auth/login', user)
        console.log(res.data);
        return res.data

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message);
    }

})

// ======================================================== //
// ======================= LOGOUT PROCESS ====================== //
// ======================================================== //

export const logout = createAsyncThunk<LogoutResponse, void, { rejectValue: string }>(
    "user/loggedOut",
    async(_, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.get<LogoutResponse>('/api/v1/auth/logout')
        console.log(res.data);
        return res.data

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message);

    }

})

// ======================================================== //
// ======================= GET ONLY USERS ====================== //
// ======================================================== //

export const getOnlyUser = createAsyncThunk<SafeUser[], void, { rejectValue: string }>(
    "user/getOnlyUser",
    async(_,{rejectWithValue})=>{

    try {
        
        const res = await apiInstance.get<{ users: SafeUser[] }>('/api/v1/auth/users')
        return res.data.users

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message);
        
    }

})
