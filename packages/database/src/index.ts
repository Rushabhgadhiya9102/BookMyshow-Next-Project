import mongoose from "mongoose";

export * from "./models/user.model";
export * from "./models/movie.model";
export * from "./models/seat.model";
export * from "./models/ticket.model";
export * from "./models/comment.model";

declare global {
  var __mongooseGlobalPromise__: Promise<typeof mongoose> | undefined;
}

export const connectDatabase = async (mongoUrl: string): Promise<typeof mongoose> => {
  if (!mongoUrl) {
    throw new Error("MongoDB connection URL is missing");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    global.__mongooseGlobalPromise__ ??= mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 10000,
    });

    const connection = await global.__mongooseGlobalPromise__;
    return connection;
  } catch (error) {
    global.__mongooseGlobalPromise__ = undefined;
    throw error instanceof Error ? error : new Error("Failed to connect to MongoDB");
  }
};

export default connectDatabase;
