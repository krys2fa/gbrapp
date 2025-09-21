import { NextRequest, NextResponse } from "next/server";
import {
  extractTokenFromReq,
  validateTokenAndLoadUser,
} from "@/app/lib/auth-utils";

/**
 * GET handler for validating user token
 */
export async function GET(req: NextRequest) {
  try {
    const token = await extractTokenFromReq(req);
    const validation = await validateTokenAndLoadUser(token);
    if (!validation.success || !validation.user) {
      return NextResponse.json(
        { valid: false },
        { status: validation.statusCode || 401 }
      );
    }

    return NextResponse.json({ valid: true, user: validation.user });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
