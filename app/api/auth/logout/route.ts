import { NextRequest, NextResponse } from "next/server";

/**
 * POST handler for user logout
 */
export async function POST(req: NextRequest) {
  // Create response
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear the auth cookie
  response.cookies.set({
    name: "auth-token",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0, // Expire immediately
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
