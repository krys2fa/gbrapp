import { NextRequest, NextResponse } from "next/server";
import { validateJWTUser } from "@/lib/jwt-user-validation";
import {
  hasPermission,
  PermissionModule,
  UserRole,
} from "@/app/lib/role-permissions";

/**
 * API validation result interface
 */
export interface APIValidationResult {
  success: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  error?: string;
  statusCode?: number;
}

/**
 * Validate JWT token and extract user information
 */
export async function validateAPIToken(
  req: NextRequest
): Promise<APIValidationResult> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        error: "Authorization header required",
        statusCode: 401,
      };
    }

    const token = authHeader.substring(7);

    // Validate JWT and get user
    const validation = await validateJWTUser(token);

    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        statusCode: validation.statusCode || 401,
      };
    }

    return {
      success: true,
      user: {
        id: validation.user!.id,
        name: validation.user!.name,
        email: validation.user!.email,
        role: validation.user!.role as UserRole,
      },
    };
  } catch (error) {
    console.error("API token validation error:", error);
    return {
      success: false,
      error: "Internal server error during authentication",
      statusCode: 500,
    };
  }
}

/**
 * Validate user has permission to access a specific module
 */
export async function validateAPIPermission(
  req: NextRequest,
  requiredModule: PermissionModule
): Promise<APIValidationResult> {
  // First validate the token
  const tokenValidation = await validateAPIToken(req);

  if (!tokenValidation.success) {
    return tokenValidation;
  }

  const user = tokenValidation.user!;

  // SUPERADMIN has access to everything
  if (user.role === "SUPERADMIN") {
    return {
      success: true,
      user,
    };
  }

  // Check if user has permission for the module
  if (!hasPermission(user.role, requiredModule)) {
    return {
      success: false,
      error: `Access denied. Insufficient permissions for ${requiredModule} module.`,
      statusCode: 403,
    };
  }

  return {
    success: true,
    user,
  };
}

/**
 * Validate user has one of the required permissions (OR logic)
 */
export async function validateAPIPermissions(
  req: NextRequest,
  requiredModules: PermissionModule[]
): Promise<APIValidationResult> {
  // First validate the token
  const tokenValidation = await validateAPIToken(req);

  if (!tokenValidation.success) {
    return tokenValidation;
  }

  const user = tokenValidation.user!;

  // SUPERADMIN has access to everything
  if (user.role === "SUPERADMIN") {
    return {
      success: true,
      user,
    };
  }

  // Check if user has permission for at least one of the modules
  const hasAnyPermission = requiredModules.some((module) =>
    hasPermission(user.role, module)
  );

  if (!hasAnyPermission) {
    return {
      success: false,
      error: `Access denied. Insufficient permissions for required modules: ${requiredModules.join(
        ", "
      )}.`,
      statusCode: 403,
    };
  }

  return {
    success: true,
    user,
  };
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(
  error: string,
  statusCode: number = 401
) {
  return NextResponse.json({ error, success: false }, { status: statusCode });
}

/**
 * Create success response with data
 */
export function createSuccessResponse(data: any, statusCode: number = 200) {
  return NextResponse.json({ success: true, data }, { status: statusCode });
}
