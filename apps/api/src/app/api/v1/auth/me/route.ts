import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import UserData from "@/entities/user/model";
import database from "@/server/db/connect";
import { getDataFromToken } from "@/server/security/auth-user";

export const GET = async (req: NextRequest) => {
  try {
    await database();

    const userId = getDataFromToken(req);
    const user = await UserData.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found", status: 404 }, { status: 404 });
    }

    return NextResponse.json({ message: "User found", status: 200, data: user }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch current user";
    console.error("Auth me route error:", message);

    return NextResponse.json({ message, status: 500 }, { status: 500 });
  }
};
