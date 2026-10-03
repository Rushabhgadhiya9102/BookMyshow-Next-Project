import mongoose from "mongoose";
import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

declare global {
  var __prismaGlobalClient__: PrismaClient | undefined;
  var __mongooseGlobalPromise__: Promise<typeof mongoose> | undefined;
}

export const getPrismaClient = (): PrismaClient => {
  if (process.env.NODE_ENV === "production") {
    return new PrismaClient();
  }
  if (!global.__prismaGlobalClient__) {
    global.__prismaGlobalClient__ = new PrismaClient({
      log: ["warn", "error"],
    });
  }
  return global.__prismaGlobalClient__;
};

export const prisma = getPrismaClient();

export * from "./models/user.model";
export * from "./models/movie.model";
export * from "./models/seat.model";
export * from "./models/ticket.model";
export * from "./models/comment.model";

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
