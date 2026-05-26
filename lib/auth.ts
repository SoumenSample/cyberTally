import { decode, encode } from "next-auth/jwt";

export const AUTH_COOKIE_NAME = "tally-session";
export const AUTH_SECRET =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  "tallysoftware-dev-secret";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AuthRole = "admin" | "accountant" | "employee";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createSessionToken(user: SessionUser) {
  return encode({
    token: user,
    secret: AUTH_SECRET,
    maxAge: SESSION_MAX_AGE,
  });
}

export async function verifySessionToken(token: string) {
  const payload = await decode({ token, secret: AUTH_SECRET });

  if (!payload || typeof payload.id !== "string" || typeof payload.email !== "string") {
    return null;
  }

  return {
    id: payload.id,
    name: typeof payload.name === "string" ? payload.name : "",
    email: payload.email,
    role:
      payload.role === "admin" ||
      payload.role === "accountant" ||
      payload.role === "employee"
        ? payload.role
        : "employee",
  } satisfies SessionUser;
}

export function hasRole(user: SessionUser | null, roles: AuthRole | AuthRole[]) {
  if (!user) return false
  const allowed = Array.isArray(roles) ? roles : [roles]
  return allowed.includes(user.role)
}