import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { logger, LogCategory } from "@/lib/logger";

export interface UserSession {
  userId: string;
  email: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
}

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-for-development-only";

/**
 * Verifies the JWT token and returns the session data
 *
 * @returns The session data if token is valid, null otherwise
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return payload as unknown as UserSession;
  } catch (error) {
    await logger.error(LogCategory.AUTH, "Failed to verify token", {
      error: String(error),
    });
    return null;
  }
}

/**
 * Checks if the current user has any of the specified roles
 *
 * @param allowedRoles Array of roles allowed to access the resource
 * @returns True if user has any of the allowed roles, false otherwise
 */
export async function hasRole(allowedRoles: string[]): Promise<boolean> {
  const session = await getSession();

  if (!session) {
    return false;
  }

  return allowedRoles.includes(session.role);
}

/**
 * Checks if the current user is authenticated
 *
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
