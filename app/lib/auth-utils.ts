import { NextRequest } from "next/server";
import * as jose from "jose";
import { prisma } from "@/app/lib/prisma";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-for-development-only";

export async function extractTokenFromReq(
  req: NextRequest
): Promise<string | null> {
  // Prefer Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer "))
    return authHeader.substring(7);

  // Fallback to cookie named auth-token
  try {
    const cookie = req.cookies.get("auth-token")?.value || null;
    if (cookie) return cookie;
  } catch (e) {
    // ignore
  }

  return null;
}

export async function validateTokenAndLoadUser(token: string | null) {
  if (!token) {
    return { success: false, error: "No token provided", statusCode: 401 };
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    const userId = payload.userId as string;

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

    if (!user) {
      return { success: false, error: "User not found", statusCode: 401 };
    }

    // Optionally check isActive
    if (user.isActive === false) {
      return { success: false, error: "User inactive", statusCode: 403 };
    }

    return { success: true, user, tokenPayload: payload };
  } catch (error: any) {
    if (error?.name === "JWTExpired") {
      return { success: false, error: "Token expired", statusCode: 401 };
    }
    return { success: false, error: "Invalid token", statusCode: 401 };
  }
}

// Lightweight token-only verification for use in Edge/middleware contexts.
export async function verifyTokenPayload(token: string | null) {
  if (!token)
    return { success: false, error: "No token provided", statusCode: 401 };

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    // Only return payload (don't query DB in Edge)
    return { success: true, payload };
  } catch (error: any) {
    if (error?.name === "JWTExpired") {
      return { success: false, error: "Token expired", statusCode: 401 };
    }
    return { success: false, error: "Invalid token", statusCode: 401 };
  }
}
