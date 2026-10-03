import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

import type { AuthTokenPayload } from "@/entities/user/types";
import envSetup from "@/shared/lib/env";

export const getDataFromToken = (req: NextRequest): string => {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    throw new Error("Authentication token is missing");
  }

  const decoded = jwt.verify(token, envSetup.SecretKey) as AuthTokenPayload;
  return decoded.id;
};
