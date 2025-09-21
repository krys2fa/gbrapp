import { NextRequest } from "next/server";
import * as jose from "jose";
import { prisma } from "@/app/lib/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-for-development-only";

/**
 * Extract token from a NextRequest (Authorization header or cookie)
 */
export async function extractTokenFromReq(
  req: NextRequest | any
): Promise<string | null> {
  // Prefer Authorization header
  try {
    const authHeader =
      req.headers?.get?.("authorization") || req.headers?.authorization;
    if (
      authHeader &&
      typeof authHeader === "string" &&
      authHeader.startsWith("Bearer ")
    )
      return authHeader.substring(7);
  } catch (e) {
    // ignore
  }

  // Fallback to cookie named auth-token (NextRequest.cookies / Node request)
  try {
    // NextRequest: req.cookies.get('auth-token')?.value
    if (req.cookies && typeof req.cookies.get === "function") {
      const cookie = req.cookies.get("auth-token")?.value || null;
      if (cookie) return cookie;
    }

    // Node/Express-like: req.headers.cookie
    const cookieHeader = req.headers?.cookie || req.cookies;
    if (cookieHeader && typeof cookieHeader === "string") {
      const match = cookieHeader.match(/auth-token=([^;]+)/);
      if (match) return match[1];
    }
  } catch (e) {
    // ignore
  }

  return null;
}

/**
 * Validate token by verifying JWT and loading the user from DB
 */
export async function validateTokenAndLoadUser(token: string | null) {
  if (!token) {
    return { success: false, error: "No token provided", statusCode: 401 };
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret as any);

    const userId = (payload as any).userId as string;

    if (!userId) {
      return {
        success: false,
        error: "Invalid token payload",
        statusCode: 401,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user)
      return { success: false, error: "User not found", statusCode: 401 };

    if (user.isActive === false)
      return { success: false, error: "User inactive", statusCode: 403 };

    return { success: true, user, tokenPayload: payload };
  } catch (error: any) {
    if (error?.name === "JWTExpired")
      return { success: false, error: "Token expired", statusCode: 401 };
    return { success: false, error: "Invalid token", statusCode: 401 };
  }
}

/**
 * Lightweight verification returning only the payload — suitable for middleware/Edge
 */
export async function verifyTokenPayload(token: string | null) {
  if (!token)
    return { success: false, error: "No token provided", statusCode: 401 };

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret as any);
    return { success: true, payload };
  } catch (error: any) {
    if (error?.name === "JWTExpired")
      return { success: false, error: "Token expired", statusCode: 401 };
    return { success: false, error: "Invalid token", statusCode: 401 };
  }
}
