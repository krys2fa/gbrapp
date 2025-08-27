import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auditTrailMiddleware } from "./app/middleware/audit-trail";
import { verify } from "jsonwebtoken";

// Public paths that don't require authentication
const publicPaths = ["/login", "/api/auth/login", "/api/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply audit trail middleware for API routes
  if (pathname.startsWith("/api/")) {
    return auditTrailMiddleware(request);
  }
  
  // Check if the path is public
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  
  // For protected routes, check auth token
  const token = request.cookies.get("auth-token")?.value;
  
  // If no token found, redirect to login
  if (!token) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  
  // Verify token
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development-only";
    verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Apply middleware to all API routes and protected pages
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
