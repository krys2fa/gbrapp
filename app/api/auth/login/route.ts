import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as jose from 'jose';
import { cookies } from "next/headers";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-for-development-only";

/**
 * POST handler for user login
 */
async function login(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token using jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('8h')
      .sign(secret);

    // Create a clean user object without sensitive data
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Create response
    const response = NextResponse.json({
      user: userResponse,
      token,
    });

    // Set cookie in response
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// Export the login handler directly without audit trail since we're handling that specially
export const POST = login;
