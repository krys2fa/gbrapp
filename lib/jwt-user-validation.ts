// lib/jwt-user-validation.ts
import { prisma } from "@/app/lib/prisma";
import * as jose from "jose";
import { logger, LogCategory } from "./logger";

export interface ValidatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface UserValidationOptions {
  allowFallbackToSystem?: boolean;
  requiredRoles?: string[];
}

/**
 * Validates JWT token and ensures the user exists in the database
 */
export async function validateJWTUser(
  token: string,
  options: UserValidationOptions = {}
): Promise<{
  success: boolean;
  user?: ValidatedUser;
  error?: string;
  statusCode?: number;
}> {
  const JWT_SECRET =
    process.env.JWT_SECRET || "fallback-secret-for-development-only";
  const secret = new TextEncoder().encode(JWT_SECRET);

  try {
    // Verify JWT token
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId as string;
    const jwtRole = payload.role as string;

    // Validate that the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      console.warn(`User with ID ${userId} not found in database`);

      // Try fallback to system user if allowed
      if (options.allowFallbackToSystem) {
        const systemUser = await prisma.user.findFirst({
          where: {
            OR: [{ email: "system@gbrapp.com" }, { role: "SUPERADMIN" }],
          },
          select: { id: true, name: true, email: true, role: true },
        });

        if (systemUser) {
          await logger.info(
            LogCategory.AUTH,
            `Using system user ${systemUser.name} (${systemUser.id}) as fallback`
          );
          return {
            success: true,
            user: {
              id: systemUser.id,
              name: systemUser.name,
              email: systemUser.email,
              role: systemUser.role,
            },
          };
        }
      }

      return {
        success: false,
        error: "User not found. Please log in again.",
        statusCode: 401,
      };
    }

    // Verify role from database matches JWT (use DB role as source of truth)
    const actualRole = user.role;
    if (actualRole !== jwtRole) {
      console.warn(
        `Role mismatch for user ${userId}: JWT has ${jwtRole}, DB has ${actualRole}`
      );
    }

    // Check if user has required role
    if (options.requiredRoles && !options.requiredRoles.includes(actualRole)) {
      return {
        success: false,
        error: `Unauthorized. Required roles: ${options.requiredRoles.join(
          ", "
        )}. Your role: ${actualRole}`,
        statusCode: 403,
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: actualRole,
      },
    };
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return {
        success: false,
        error: "Token expired. Please log in again.",
        statusCode: 401,
      };
    }

    return {
      success: false,
      error: "Unauthorized. Invalid token.",
      statusCode: 401,
    };
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
