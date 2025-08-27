import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auditTrailMiddleware } from "./app/middleware/audit-trail";
import * as jose from 'jose';

// Public paths that don't require authentication
const publicPaths = ["/login", "/api/auth/login", "/api/auth/register", "/unauthorized"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware completely for static files and public paths
  if (
    pathname.includes("/_next") || 
    pathname.includes("/favicon.ico") ||
    pathname.includes(".png") ||
    pathname.includes(".svg") ||
    pathname.includes(".jpg") ||
    pathname.includes(".jpeg") ||
    pathname.includes(".webp") ||
    publicPaths.includes(pathname)
  ) {
    return NextResponse.next();
  }
  
  // Apply audit trail middleware for API routes
  if (pathname.startsWith("/api/")) {
    return auditTrailMiddleware(request);
  }
  
  // For protected routes, check auth token
  const token = request.cookies.get("auth-token")?.value;
  
  // If no token found, redirect to login
  if (!token) {
    console.log("No token found in middleware for path:", pathname);
    console.log("All cookies:", request.cookies.getAll());
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  
  // Verify token using jose instead of jsonwebtoken
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development-only";
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // Verify the token with jose
    await jose.jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    console.error("Invalid token:", error);
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Apply middleware to all API routes and protected pages
    "/api/:path*",
    "/(dashboard|users|exporters|job-cards|assays|invoices|settings|job-card|evaluation|sealing-certification|payment-receipting)/:path*",
    "/dashboard",
    "/settings",
    "/job-card",
    "/evaluation",
    "/sealing-certification",
    "/payment-receipting",
  ],
};
