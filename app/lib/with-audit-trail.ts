import { ActionType } from "@/app/generated/prisma";
import { AuditTrailService } from "@/app/lib/audit-trail";
import { NextRequest, NextResponse } from "next/server";

interface AuditableRouteOptions {
  entityType: string;
}

// More generic type that accepts any params structure
type RouteHandler<T = any> = (
  req: NextRequest,
  params: { params: T }
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps API route handlers to add audit trail functionality
 *
 * @param handler The original route handler
 * @param options Options for the auditable route
 * @returns The wrapped route handler with audit trail
 */
export function withAuditTrail<T = Record<string, string>>(
  handler: RouteHandler<T>,
  options: AuditableRouteOptions
) {
  return async (req: NextRequest, params: { params: T }) => {
    // Extract user ID from auth context (replace with your actual auth logic)
    const authHeader = req.headers.get("authorization");
    let userId = "unknown";

    if (authHeader?.startsWith("Bearer ")) {
      // In a real app, you'd verify the token and extract the user ID
      const token = authHeader.substring(7);
      // This is a placeholder - replace with actual token verification
      userId = token;
    }

    // If we're handling a login request, we don't have a userId yet, so skip audit for now
    if (req.nextUrl.pathname === "/api/auth/login" && req.method === "POST") {
      // Skip audit trail for login attempts to avoid foreign key constraint issues
      return await handler(req, params);
    }

    // Determine action type from HTTP method
    const method = req.method;
    let action: ActionType;

    switch (method) {
      case "GET":
        action = ActionType.VIEW;
        break;
      case "POST":
        action = ActionType.CREATE;
        break;
      case "PUT":
      case "PATCH":
        action = ActionType.UPDATE;
        break;
      case "DELETE":
        action = ActionType.DELETE;
        break;
      default:
        action = ActionType.OTHER;
    }

    // Determine entity ID from URL params, safely handling cases where params might be undefined
    const entityId = params.params
      ? (params.params as any).id || "unknown"
      : "unknown";

    // For POST/PUT/PATCH requests, capture the request body
    let details: any = null;
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try {
        // Clone the request to read the body without consuming it
        const clonedRequest = req.clone();
        const body = await clonedRequest.json();
        details = body;
      } catch (error) {
        console.error("Error reading request body for audit:", error);
      }
    }

    // Call the original handler
    try {
      const response = await handler(req, params);

      // Record successful audit trail
      await AuditTrailService.createAuditTrail({
        userId,
        action,
        entityType: options.entityType,
        entityId,
        details,
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        metadata: {
          url: req.nextUrl.pathname,
          method,
          status: response.status,
        },
      });

      return response;
    } catch (error) {
      // Record error in audit trail
      await AuditTrailService.createAuditTrail({
        userId,
        action,
        entityType: options.entityType,
        entityId,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          originalData: details,
        },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        metadata: {
          url: req.nextUrl.pathname,
          method,
          status: 500,
          error: true,
        },
      });

      // Re-throw the error for the API route to handle
      throw error;
    }
  };
}
