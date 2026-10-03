import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "@/features/auth/store/userSlice";
import movieReducer from "@/features/movies/store/movieSlice";
import ticketReducer from "@/features/tickets/store/ticketSlice";

const rootReducer = combineReducers({
  users: userReducer,
  movies: movieReducer,
  tickets: ticketReducer
});

export default rootReducer;
