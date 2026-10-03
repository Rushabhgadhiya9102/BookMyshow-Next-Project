import type { SafeUser } from "@/entities/user/types";
import { createSlice } from "@reduxjs/toolkit"
import { getOnlyUser, login, logout, signUp } from "./thunk"

interface userState {

    users: SafeUser[]
    loading: boolean
    error: null | string
    loggedIn: boolean

}

const initialState: userState = {

    users: [],
    loading: false,
    error: null,
    loggedIn: false

}

const userSlice = createSlice({

    name: "users",
    initialState,
    reducers: {},
    extraReducers: (builder) => {

        // ======================================================== //
        // ======================= GETS ALL USERS ====================== //
        // ======================================================== // 

        builder.addCase(getOnlyUser.pending, (state)=>{
            state.loading = true
        })

        builder.addCase(getOnlyUser.fulfilled, (state,action)=>{
            state.loading = false
            state.users = action.payload
        })

        builder.addCase(getOnlyUser.rejected, (state,action)=>{
            state.loading = false
            state.error = action.error.message as string
        })

        // ======================================================== //
        // ======================= SIGN UP USERS ====================== //
        // ======================================================== // 

        builder.addCase(signUp.pending, (state) => {
            state.loading = true
        })

        builder.addCase(signUp.fulfilled, (state) => {
            state.loading = false
        })

        // ======================================================== //
        // ======================= LOGIN USERS ====================== //
        // ======================================================== // 

        builder.addCase(login.pending, (state) => {
            state.loading = true
        })

        builder.addCase(login.fulfilled, (state) => {
            state.loading = false
            state.loggedIn = true
        })

        // ======================================================== //
        // ======================= LOGOUT USERS ====================== //
        // ======================================================== // 

        builder.addCase(logout.fulfilled, (state) => {
            state.loading = false
            state.users = []
            state.loggedIn = false
        })

    }

})

export default userSlice.reducer
