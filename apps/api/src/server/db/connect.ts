import mongoose from "mongoose";

import envSetup from "@/shared/lib/env";

declare global {
  var __mongooseConnectionPromise__: Promise<typeof mongoose> | undefined;
}

const database = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const mongoUrl = envSetup.Mongo_URL;

  try {
    global.__mongooseConnectionPromise__ ??= mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 10000,
    });

    const connection = await global.__mongooseConnectionPromise__;
    return connection;
  } catch (error) {
    global.__mongooseConnectionPromise__ = undefined;
    throw error instanceof Error ? error : new Error("Failed to connect to MongoDB");
  }
};

export default database;
