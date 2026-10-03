import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import UserData from "@/entities/user/model";
import type { SignupFormValues } from "@/features/auth/types";
import database from "@/server/db/connect";

export const POST = async (req: Request) => {
  try {
    await database();

    const body = (await req.json()) as SignupFormValues;
    const { password, confirmPassword, email } = body;

    const existingUser = await UserData.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists", status: 400 }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match", status: 400 }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await UserData.create({ ...body, password: hashedPassword });

    return NextResponse.json(
      { message: "User created", createUserData: createdUser, status: 201 },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    console.error("Signup route error:", message);

    return NextResponse.json({ message, status: 500 }, { status: 500 });
  }
};
