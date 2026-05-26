import { cookies } from "next/headers";

import {
  AUTH_COOKIE_NAME,
  type SessionUser,
  verifySessionToken,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Company from "@/models/Company";
import User from "@/models/User";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getCurrentUserRecord() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    return null;
  }

  await connectDB();

  return User.findById(sessionUser.id).select("name email role activeCompany companies");
}

export async function getDefaultCompanyIdForCurrentUser() {
  const currentUser = await getCurrentUserRecord();

  if (currentUser?.activeCompany) {
    return currentUser.activeCompany.toString();
  }

  await connectDB();

  const company = await Company.findOne().sort({ createdAt: 1 }).select("_id");

  return company?._id ? company._id.toString() : null;
}