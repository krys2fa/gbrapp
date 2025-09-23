import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { Role } from "@/app/generated/prisma";
import { logger, LogCategory } from "@/lib/logger";

interface DecodedToken {
  userId: string;
  email: string;
  role: Role;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Higher-order function that wraps API route handlers to add authentication and authorization
 *
 * @param handler The original route handler
 * @param requiredRoles Array of roles allowed to access the route (empty means any authenticated user)
 * @returns The wrapped route handler with auth protection
 */
type AnyRouteHandler = (...args: any[]) => Promise<NextResponse>;

export function withAuth<H extends AnyRouteHandler>(
  handler: H,
  requiredRoles: Role[] = []
) {
  return (async (...args: Parameters<H>): Promise<NextResponse> => {
    const req = args[0] as NextRequest;
    const JWT_SECRET =
      process.env.JWT_SECRET || "fallback-secret-for-development-only";

    // Extract token from Authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No valid token provided" },
        { status: 401 }
      );
    }

    try {
      // Verify the token using jose
      const token = authHeader.substring(7);
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);

      const decoded: DecodedToken = {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as Role,
        name: payload.name as string,
      };

      // Check if token has required role (if roles are specified)
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return NextResponse.json(
          {
            error: "Forbidden - Insufficient permissions",
            requiredRoles,
            userRole: decoded.role,
          },
          { status: 403 }
        );
      }

      // Optional: enforce role checks without altering handler signature
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return NextResponse.json(
          {
            error: "Forbidden - Insufficient permissions",
            requiredRoles,
            userRole: decoded.role,
          },
          { status: 403 }
        );
      }

      // Call the original handler with unmodified signature
      return handler(...(args as Parameters<H>));
    } catch (error: any) {
      await logger.error(LogCategory.AUTH, "Authentication error", {
        error: String(error),
      });

      if (error.name === "TokenExpiredError") {
        return NextResponse.json(
          { error: "Unauthorized - Token expired" },
          { status: 401 }
        );
      }

      if (error.name === "JsonWebTokenError") {
        return NextResponse.json(
          { error: "Unauthorized - Invalid token" },
          { status: 401 }
        );
      }

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }) as unknown as H;
}
