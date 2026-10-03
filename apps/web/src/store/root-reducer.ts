import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "@/features/auth/store/userSlice";
import movieReducer from "@/features/movies/store/movieSlice";
import commentReducer from "@/features/comments/store/commentSlice";
import seatsReducer from "@/features/seats/store/seatsSlice";
import ticketReducer from "@/features/tickets/store/ticketSlice";
import stripeReducer from "@/features/payments/store/stripeSlice";

const rootReducer = combineReducers({
  users: userReducer,
  movies: movieReducer,
  comments: commentReducer,
  seats: seatsReducer,
  tickets: ticketReducer,
  payments: stripeReducer
});

export default rootReducer;
