import { ActionType } from "@/app/generated/prisma";
import { AuditTrailService } from "@/app/lib/audit-trail";
import { NextRequest, NextResponse } from "next/server";
import { extractTokenFromReq, validateTokenAndLoadUser } from "./auth-utils";

interface AuditableRouteOptions {
  entityType: string;
}

// Generic wrapper type that preserves the original handler signature
type AnyRouteHandler = (...args: any[]) => Promise<NextResponse>;

/**
 * Higher-order function that wraps API route handlers to add audit trail functionality
 *
 * @param handler The original route handler
 * @param options Options for the auditable route
 * @returns The wrapped route handler with audit trail
 */
export function withAuditTrail<H extends AnyRouteHandler>(
  handler: H,
  options: AuditableRouteOptions
) {
  // Preserve the original handler signature to satisfy Next.js typed routes
  return (async (...args: Parameters<H>): Promise<NextResponse> => {
    const req = args[0] as NextRequest;
    const ctx = (args.length > 1 ? args[1] : undefined) as
      | { params?: any }
      | { params?: Promise<any> }
      | undefined;
    // Extract user ID from token (header or cookie) using centralized helper
    let userId = "unknown";
    try {
      const token = await extractTokenFromReq(req);
      const validation = await validateTokenAndLoadUser(token);
      if (validation.success && validation.user) {
        userId = validation.user.id;
      }
    } catch (e) {
      console.warn("Failed to extract user for audit trail:", e);
    }

    // If we're handling a login request, we don't have a userId yet, so skip audit for now
    if (req.nextUrl.pathname === "/api/auth/login" && req.method === "POST") {
      // Skip audit trail for login attempts to avoid foreign key constraint issues
      return await handler(...(args as Parameters<H>));
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
    let entityId = "unknown";
    // Prefer extracting id from ctx.params (supports both sync and Promise in Next 15)
    try {
      const maybeParams = ctx?.params;
      if (maybeParams) {
        if (typeof (maybeParams as any)?.then === "function") {
          const resolved = await (maybeParams as Promise<any>);
          entityId = resolved?.id ?? entityId;
        } else {
          entityId = (maybeParams as any)?.id ?? entityId;
        }
      }
    } catch (error) {
      console.log(error);
      // Fallback to parsing from URL as a last resort
      const parts = req.nextUrl.pathname.split("/").filter(Boolean);
      entityId = parts[parts.length - 1] ?? entityId;
    }

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
      const response = await handler(...(args as Parameters<H>));

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
  }) as unknown as H;
}
