import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, isValidToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API = ["/api/login", "/api/logout"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals, static assets, favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/__next") ||
    pathname === "/favicon.ico" ||
    /\.(?:png|jpg|jpeg|svg|webp|gif|ico|txt|xml|woff2?|ttf|otf)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Public routes (login page + login/logout APIs)
  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_API.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (isValidToken(token)) {
    return NextResponse.next();
  }

  // Redirect unauthenticated to /login with ?next=
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except explicit static paths (handled inside too for safety).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
