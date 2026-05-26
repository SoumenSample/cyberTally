import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  normalizeEmail,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginBody;
  const email = body.email ? normalizeEmail(body.email) : "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  await connectDB();

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const sessionUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  } as const;

  const token = await createSessionToken(sessionUser);
  const response = NextResponse.json({ user: sessionUser });

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}