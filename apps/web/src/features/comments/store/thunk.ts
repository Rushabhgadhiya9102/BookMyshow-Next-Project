import apiInstance from "@/shared/lib/api-client";
import type { Comment, CommentPayload, UpdateCommentPayload } from "@/features/comments/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getCommentsByMovieId = createAsyncThunk<Comment[], string, { rejectValue: string }>(
    'fetch/commentByMovieId',
    async(movieId, {rejectWithValue})=>{

    try{

        const res = await apiInstance.get<{ movieComment: Comment[] }>(`/api/v1/comments/${movieId}`)
        return res.data.movieComment

    }catch(error){
        const err = error as Error
        return rejectWithValue(err.message)
    }

})

export const addComment = createAsyncThunk<Comment, CommentPayload, { rejectValue: string }>(
    'add/comment',
    async(comment, {rejectWithValue})=>{

    try {
        
        const res = await apiInstance.post<{ comment: Comment }>('/api/v1/comments', comment)
        return res.data.comment

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message)
        
    }

})

export const deleteComment = createAsyncThunk<string, string, { rejectValue: string }>(
    'delete/comment',
    async(commentId, {rejectWithValue})=>{

    try {
        
        await apiInstance.delete(`/api/v1/comments/${commentId}`)
        return commentId

    } catch (error) {
        const err = error as Error
        return rejectWithValue(err.message)

    }

})

export const updateComment = createAsyncThunk<Comment, UpdateCommentPayload, { rejectValue: string }>(
    'update/comment',
    async(commentData, {rejectWithValue})=>{

    try {
        
        const {_id} = commentData
        const res = await apiInstance.patch<{ updatedComment: Comment }>(`/api/v1/comments/${_id}`, commentData)
        return res.data.updatedComment

    } catch (error) {
        
        const err = error as Error
        return rejectWithValue(err.message)

    }

})
