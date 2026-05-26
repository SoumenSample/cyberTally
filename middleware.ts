import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { AUTH_COOKIE_NAME, AUTH_SECRET } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await getToken({
    req: request,
    secret: AUTH_SECRET,
    cookieName: AUTH_COOKIE_NAME,
  });

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isDashboardRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};