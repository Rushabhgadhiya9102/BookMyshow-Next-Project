import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

declare global {
  var __prismaGlobalClient__: PrismaClient | undefined;
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
