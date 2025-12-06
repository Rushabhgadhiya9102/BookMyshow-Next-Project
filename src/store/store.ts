import { configureStore } from "@reduxjs/toolkit";
import userReducer from './users/userSlice'
import movieReducer from './movies/movieSlice'
import seatsReducer from './seats/seatsSlice'
import commentReducer from './comments/commentSlice'
import ticketReducer from './tickets/ticketSlice'

const store = configureStore({

    reducer:{
        users: userReducer,
        movies: movieReducer,
        seats: seatsReducer,
        comments: commentReducer,
        tickets: ticketReducer
    }

})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store