import { createSlice } from "@reduxjs/toolkit"
import { addMovie, deleteMovie, getmovie, getmovieById, updateMovie } from "./thunk"

// ======================= MOVIE INTERFACE ====================== //
// ======================================================== //

interface MovieState {
    movies: any[]
    loading: boolean
    error: string | null
    selectedMovie: any | null
}

// ======================= INITIAL STATE ====================== //
// ======================================================== //

const initialState: MovieState = {
    movies: [],
    loading: false,
    error: null,
    selectedMovie: null
}

// ======================= MOVIE SLICES ====================== //
// ======================================================== //

const movieSlice = createSlice({

    name: "movies",
    initialState,
    reducers: {
        setSelectedMovie: (state, action) => {
            state.selectedMovie = action.payload
        },

        clearSelectedMovie: (state) => {
            state.selectedMovie = null
        },

    },
    extraReducers: (builder) => {

        // ======================================================== //
        // ======================= GET MOVIES ====================== //
        // ======================================================== //

        builder.addCase(getmovie.pending, (state) => {
            state.loading = true
        })

        builder.addCase(getmovie.fulfilled, (state, action) => {
            state.loading = false
            state.movies = action.payload
        })

        builder.addCase(getmovie.rejected, (state, action) => {
            state.loading = false
            state.error = action.error.message as string
        })

        // ======================================================== //
        // ======================= GET MOVIES BY ID ====================== //
        // ======================================================== //

        builder.addCase(getmovieById.pending, (state) => {
            state.loading = true
        })

        builder.addCase(getmovieById.fulfilled, (state, action) => {
            state.loading = false
            state.selectedMovie = action.payload
        })

        builder.addCase(getmovieById.rejected, (state, action) => {
            state.loading = false
            state.error = action.error.message as string
        })

        // ======================================================== //
        // ======================= ADD MOVIES ====================== //
        // ======================================================== //

        builder.addCase(addMovie.pending, (state) => {
            state.loading = true
        })

        builder.addCase(addMovie.fulfilled, (state, action) => {
            state.loading = false
            state.movies.push(action.payload)
        })

        builder.addCase(addMovie.rejected, (state, action) => {
            state.loading = false
            state.error = action.error.message as string
        })

        // ======================================================== //
        // ======================= DELETE MOVIES ====================== //
        // ======================================================== //

        builder.addCase(deleteMovie.pending, (state) => {
            state.loading = true
        })

        builder.addCase(deleteMovie.fulfilled, (state, action) => {
            state.loading = false
            state.movies = state.movies.filter(movie => movie._id !== action.payload)
        })

        builder.addCase(deleteMovie.rejected, (state, action) => {
            state.loading = false
            state.error = action.error.message as string
        })

        // ======================================================== //
        // ======================= UPDATE MOVIES ====================== //
        // ======================================================== //

        builder.addCase(updateMovie.pending, (state) => {
            state.loading = true
        })

        builder.addCase(updateMovie.fulfilled, (state, action) => {
            state.loading = false
            state.movies = state.movies.map((movie) => {
                if (movie._id === action.payload._id) {
                    return action.payload
                } else {
                    return movie
                }
            })
        })

        builder.addCase(updateMovie.rejected, (state, action) => {
            state.loading = false
            state.error = action.error.message as string
        })



    }

})

export const { setSelectedMovie, clearSelectedMovie } = movieSlice.actions
export default movieSlice.reducer