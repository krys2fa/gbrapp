import { ActionType } from "@/app/generated/prisma";
import { AuditTrailService } from "@/app/lib/audit-trail";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Routes that should be audited
 */
const AUDITABLE_ROUTES = [
  "/api/job-cards",
  "/api/invoices",
  "/api/assays",
  "/api/seals",
  "/api/fees",
  "/api/levies",
];

/**
 * Map HTTP methods to action types
 */
const METHOD_TO_ACTION_MAP: Record<string, ActionType> = {
  GET: ActionType.VIEW,
  POST: ActionType.CREATE,
  PUT: ActionType.UPDATE,
  PATCH: ActionType.UPDATE,
  DELETE: ActionType.DELETE,
};

/**
 * Extract entity type from URL path
 */
function extractEntityType(path: string): string {
  const parts = path.split("/").filter(Boolean);

  // Handle paths like /api/job-cards
  if (parts.length >= 2 && parts[0] === "api") {
    // Convert kebab-case to PascalCase for entity type
    const entityName = parts[1]
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");

    // Handle plural to singular
    return entityName.endsWith("s") ? entityName.slice(0, -1) : entityName;
  }

  return "Unknown";
}

/**
 * Extract entity ID from URL path
 */
function extractEntityId(path: string): string | null {
  const parts = path.split("/").filter(Boolean);

  // Handle paths like /api/job-cards/123
  if (parts.length >= 3 && parts[0] === "api") {
    return parts[2];
  }

  return null;
}

/**
 * Middleware to capture audit trails for API requests
 */
export async function auditTrailMiddleware(request: NextRequest) {
  // Only audit API routes that match our auditable routes
  const { pathname, search } = request.nextUrl;

  const shouldAudit = AUDITABLE_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!shouldAudit) {
    return NextResponse.next();
  }

  // Get user from the session (this will depend on your auth setup)
  // This is a placeholder - replace with your actual auth logic
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.next();
  }

  // Mock user extraction - replace with your actual auth logic
  let userId = "unknown";
  try {
    // This would be replaced with actual token verification
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // Mock decode - replace with actual JWT verification
      userId = token; // In a real app, you'd extract the user ID from the token
    }
  } catch (error) {
    console.error("Error extracting user from auth token:", error);
  }

  // Determine action type from HTTP method
  const method = request.method;
  const action = METHOD_TO_ACTION_MAP[method] || ActionType.OTHER;

  // Extract entity information
  const entityType = extractEntityType(pathname);
  const entityId = extractEntityId(pathname) || "unknown";

  // For POST/PUT/PATCH requests, capture the request body
  let details: Record<string, unknown> | undefined = undefined;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      // Clone the request to read the body without consuming it
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();
      details = body;
    } catch (error) {
      console.error("Error reading request body for audit:", error);
    }
  }

  // Record the audit trail
  try {
    await AuditTrailService.createAuditTrail({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        url: `${pathname}${search}`,
        method,
      },
    });
  } catch (error) {
    console.error("Error creating audit trail:", error);
  }

  return NextResponse.next();
}
