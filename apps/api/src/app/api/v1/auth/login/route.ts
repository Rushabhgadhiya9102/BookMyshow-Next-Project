import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import UserData from "@/entities/user/model";
import type { LoginCredentials } from "@/entities/user/types";
import database from "@/server/db/connect";
import { signToken } from "@/server/security/jwt";

export const POST = async (req: Request) => {
  try {
    await database();

    const body = (await req.json()) as LoginCredentials;
    const { email, password } = body;

    const user = await UserData.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found", status: 404 }, { status: 404 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ message: "Invalid password", status: 401 }, { status: 401 });
    }

    const token = signToken({
      id: String(user._id),
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json(
      { message: "Login successful", role: user.role, token, status: 200 },
      { status: 200 },
    );

    response.cookies.set("token", token, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log in";
    console.error("Login route error:", message);

    return NextResponse.json({ message, status: 500 }, { status: 500 });
  }
};
