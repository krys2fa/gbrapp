import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auditTrailMiddleware } from "./app/middleware/audit-trail";
import * as jose from "jose";
import { logger, LogCategory } from "./lib/logger";

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

  // Apply audit trail middleware for API routes
  if (pathname.startsWith("/api/")) {
    return auditTrailMiddleware(request);
  }

  // For protected routes, check auth token
  const token = request.cookies.get("auth-token")?.value;

  // If no token found, record structured log and redirect to login
  if (!token) {
    try {
      const cookies = request.cookies
        .getAll()
        .map((c) => ({ name: c.name, value: c.value }));
      // Fire-and-forget to internal logging API. Use keepalive so the request can finish.
      // This uses an internal shared secret to prevent external abuse.
      const INTERNAL_LOG_SECRET =
        process.env.INTERNAL_LOG_SECRET || "dev-internal-secret";
      fetch(`${request.nextUrl.origin}/api/internal/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-log-secret": INTERNAL_LOG_SECRET,
        },
        // keep the payload small and avoid sensitive cookie values in logs
        body: JSON.stringify({
          level: "INFO",
          category: "AUTH",
          message: `Missing auth token; redirecting to login for path ${pathname}`,
          metadata: {
            pathname,
            cookies: cookies.map((c) => ({ name: c.name })),
          },
        }),
        // allow the browser/node to finish the request even when redirecting
        keepalive: true as any,
      }).catch(() => {
        // swallow errors from the non-blocking log call
      });
    } catch (err) {
      // If anything goes wrong in middleware logging, don't prevent the redirect.
    }

    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Verify token using jose instead of jsonwebtoken
  try {
    const JWT_SECRET =
      process.env.JWT_SECRET || "fallback-secret-for-development-only";
    const secret = new TextEncoder().encode(JWT_SECRET);

    // Verify the token with jose
    await jose.jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    void logger.error(LogCategory.AUTH, "Invalid auth token in middleware", {
      error: error instanceof Error ? error.message : String(error),
    });
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
