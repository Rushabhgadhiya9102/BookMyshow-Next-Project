import apiInstance from "@/configs/apiInstance";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getCommentsByMovieId = createAsyncThunk('fetch/commentByMovieId', async(movieId: string, {rejectWithValue})=>{

    try{

        const res = await apiInstance.get(`/api/comment/${movieId}`)
        return res.data.movieComment

    }catch(error){
        const err = error as Error
        return rejectWithValue(err.message)
    }

})

export const addComment = createAsyncThunk('add/comment', async(comment:any, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post('/api/comment', comment)
        return res.data.comment

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message)
        
    }

})

export const deleteComment = createAsyncThunk('delete/comment', async(commentId:any, {rejectWithValue})=>{

    try {
        
        await apiInstance.delete(`/api/comment/${commentId}`)
        return commentId

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message)

    }

})

export const updateComment = createAsyncThunk('update/comment', async(commentData:any, {rejectWithValue})=>{

    try {
        
        const {_id} = commentData
        const res = await apiInstance.patch(`/api/comment/${_id}`, commentData)
        return res.data.updatedComment

    } catch (error) {
        
        const err = error as Error
        return rejectWithValue(err.message)

    }

})