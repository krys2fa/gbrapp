import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { logger, LogCategory } from "@/lib/logger";

/**
 * GET handler for validating user token
 */
export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET =
      process.env.JWT_SECRET || "fallback-secret-for-development-only";
    const secret = new TextEncoder().encode(JWT_SECRET);

    // Verify the token with jose
    const { payload } = await jose.jwtVerify(token, secret);

    return NextResponse.json({
      valid: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    });
  } catch (error) {
    void logger.error(LogCategory.AUTH, "Token validation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
