import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Routes that require authentication
const protectedRoutes = ["/", "/interview"];

// Routes that should redirect to home if already authenticated
const authRoutes = ["/sign-in", "/sign-up"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Check if user has a valid token
  let isValidToken = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isValidToken = true;
    } catch {
      isValidToken = false;
    }
  }

  // If on auth pages and already authenticated, redirect to home
  if (authRoutes.some((route) => pathname === route) && isValidToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If on protected pages and NOT authenticated, redirect to sign-in
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected && !isValidToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/interview/:path*", "/sign-in", "/sign-up"],
};
