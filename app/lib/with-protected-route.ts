import { NextResponse } from "next/server";
import { withAuth } from "@/app/lib/with-auth";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { Role } from "@/app/generated/prisma";

interface ApiHandlerOptions {
  entityType: string;
  requiredRoles?: Role[];
}

/**
 * Higher-order function that combines authentication, authorization, and audit trail
 * functionality for API routes.
 *
 * @param handler The original route handler
 * @param options Configuration options including entity type and required roles
 * @returns The wrapped handler with auth and audit trail
 */
type AnyRouteHandler = (...args: any[]) => Promise<NextResponse>;

export function withProtectedRoute<H extends AnyRouteHandler>(
  handler: H,
  options: ApiHandlerOptions
) {
  const { entityType, requiredRoles = [] } = options;
  // Compose wrappers while preserving the original handler signature
  const authed = withAuth(handler, requiredRoles);
  const audited = withAuditTrail(authed, { entityType });
  return audited as unknown as H;
}
