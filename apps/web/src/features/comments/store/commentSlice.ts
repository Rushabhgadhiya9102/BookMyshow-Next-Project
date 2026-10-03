import type { Comment } from "@/features/comments/types";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit"
import { addComment, deleteComment, getCommentsByMovieId, updateComment } from "./thunk"

interface CommentState {

    comments : Comment[]
    loading:boolean
    error: string | null
    selectedComment : Comment | null

}

const initialState: CommentState = {

    comments: [],
    loading: false,
    error: null,
    selectedComment : null

}

const commentSlice = createSlice({

    name:"comments",
    initialState,
    reducers:{
        setSelectedComment:(state, action: PayloadAction<Comment>)=>{
            state.selectedComment = action.payload
        },
        clearSelectedComment:(state)=>{
            state.selectedComment = null
        }

    },
    extraReducers:(builder)=>{

        // ======================================================== //
        // ======================= GET COMMENTS BY MOVIE ID ====================== //
        // ======================================================== //

        builder.addCase(getCommentsByMovieId.pending, (state) => {
            state.loading = true
            state.error = null
        })

        builder.addCase(getCommentsByMovieId.fulfilled, (state,action) => {
            state.loading = false
            state.comments = action.payload
        })

        builder.addCase(getCommentsByMovieId.rejected, (state,action) => {
            state.loading = false
            state.error = action.error.message as string
        })

        // ======================================================== //
        // ======================= ADD COMMENTS TO MOVIES BY ID ====================== //
        // ======================================================== //

        builder.addCase(addComment.pending, (state) => {
            state.loading = true
            state.error = null
        })

        builder.addCase(addComment.fulfilled, (state,action) => {
            state.loading = false
            state.comments.push(action.payload)
        })

        builder.addCase(addComment.rejected, (state,action) => {
            state.loading = false
            state.error = action.error.message as string
        })   

        // ======================================================== //
        // ======================= DELETE COMMENTS TO MOVIES BY ID ====================== //
        // ======================================================== //

        builder.addCase(deleteComment.pending, (state) => {
            state.loading = true
            state.error = null
        })

        builder.addCase(deleteComment.fulfilled, (state,action) => {
            state.loading = false
            state.comments = state.comments.filter(comment => comment._id !== action.payload)
        })

        builder.addCase(deleteComment.rejected, (state,action) => {
            state.loading = false
            state.error = action.error.message as string
        })   

        // ======================================================== //
        // ======================= UPDATE COMMENTS TO MOVIES BY ID ====================== //
        // ======================================================== //

        builder.addCase(updateComment.pending, (state) => {
            state.loading = true
            state.error = null
        })

        builder.addCase(updateComment.fulfilled, (state,action) => {
            state.loading = false
            state.comments = state.comments.map(comment => comment._id === action.payload._id ? action.payload : comment)
        })

        builder.addCase(updateComment.rejected, (state,action) => {
            state.loading = false
            state.error = action.error.message as string
        })        

    }

})

export const {setSelectedComment, clearSelectedComment} = commentSlice.actions
export default commentSlice.reducer
