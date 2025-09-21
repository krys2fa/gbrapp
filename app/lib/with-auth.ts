import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/app/generated/prisma";
import { extractTokenFromReq, validateTokenAndLoadUser } from "./auth-utils";

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
    // Extract token (header or cookie) and validate + load user from DB
    const token = await extractTokenFromReq(req);
    const validation = await validateTokenAndLoadUser(token);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: validation.statusCode || 401 });
    }

    const user = validation.user as { id: string; role: string };

    // Check required roles if provided
    if (requiredRoles.length > 0) {
      // If user's role is not in allowed roles, reject
      if (!requiredRoles.includes(user.role as Role)) {
        return NextResponse.json({ error: "Forbidden - Insufficient permissions", requiredRoles, userRole: user.role }, { status: 403 });
      }
    }

    // Attach user to request via a symbol if needed in handler (not modifying signature here)
    return handler(...(args as Parameters<H>));
  }) as unknown as H;
}
