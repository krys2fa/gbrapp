import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auditTrailMiddleware } from "./app/middleware/audit-trail";
import {
  extractTokenFromReq,
  validateTokenAndLoadUser,
  verifyTokenPayload,
} from "./app/lib/auth-server";
import fs from "fs";
import path from "path";
import {
  canAccessRoute,
  getDefaultRouteForRole,
  isValidUserRole,
  type UserRole,
} from "./app/lib/role-permissions";

// Public paths that don't require authentication
const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/register",
  "/unauthorized",
];

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

  // Apply audit trail middleware for API routes and return early so API
  // handlers perform their own authentication/authorization. Returning early
  // prevents middleware-side redirects for API fetches (which break client
  // requests like the dashboard fetching /api routes).
  if (pathname.startsWith("/api/")) {
    return auditTrailMiddleware(request);
  }

  // Extract token and validate user using centralized helper
  const token = await extractTokenFromReq(request as any);
  // Write debug info to file so we can inspect from scripts
  try {
    const debugPath = path.join(process.cwd(), "logs");
    if (!fs.existsSync(debugPath)) fs.mkdirSync(debugPath);
    const logFile = path.join(debugPath, "middleware-debug.log");
    fs.appendFileSync(
      logFile,
      `[${new Date().toISOString()}] path=${pathname} token-present=${!!token}\n`
    );
  } catch (e) {
    // ignore logging errors
  }

  // Use lightweight token verification in middleware (Edge) to avoid DB/Prisma calls
  const validation = await verifyTokenPayload(token as any);

  try {
    const debugPath = path.join(process.cwd(), "logs");
    const logFile = path.join(debugPath, "middleware-debug.log");
    fs.appendFileSync(
      logFile,
      `[${new Date().toISOString()}] validation=${JSON.stringify({
        success: validation.success,
        statusCode: validation.statusCode,
        error: validation.error,
      })}\n`
    );
  } catch (e) {
    // ignore
  }

  if (!validation.success || !(validation as any).payload) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Extract role from token payload (middleware shouldn't query DB)
  const userRole = (validation as any).payload?.role as string;
  const isActive = (validation as any).payload?.isActive;

  // If token says user is inactive, treat as unauthorized
  if (isActive === false) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    url.searchParams.set("inactive", "true");
    return NextResponse.redirect(url);
  }

  // Validate role
  if (!isValidUserRole(userRole)) {
    console.error("Invalid user role:", userRole);
    const url = new URL("/unauthorized", request.url);
    return NextResponse.redirect(url);
  }

  // Check if user has permission to access this route
  if (!canAccessRoute(userRole as UserRole, pathname)) {
    console.log(
      `User with role ${userRole} attempted to access unauthorized route: ${pathname}`
    );

    // Redirect to appropriate default route for their role
    const defaultRoute = getDefaultRouteForRole(userRole as UserRole);
    const url = new URL(defaultRoute, request.url);
    url.searchParams.set("unauthorized", "true");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all API routes and protected pages
    "/api/:path*",
    "/(dashboard|users|exporters|job-cards|assays|invoices|settings|job-card|evaluation|sealing-certification|payment-receipting|setup)/:path*",
    "/dashboard",
    "/settings",
    "/setup",
    "/job-card",
    "/evaluation",
    "/sealing-certification",
    "/payment-receipting",
  ],
};
