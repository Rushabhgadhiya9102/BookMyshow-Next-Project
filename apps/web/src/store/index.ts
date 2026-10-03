import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./root-reducer";
import { storeMiddleware } from "./middleware";

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(storeMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
