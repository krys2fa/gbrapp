import { Role } from "@/app/generated/prisma";
import { prisma } from "@/app/lib/prisma";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { logger, LogCategory } from "@/lib/logger";

/**
 * POST handler for user registration
 * Note: In a real application, this might be restricted to admin users only,
 * or have additional validation/approval steps
 */
async function register(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role && !Object.values(Role).includes(role)) {
      return NextResponse.json(
        { error: "Invalid role provided" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || Role.USER, // Default to USER role if none provided
        isActive: true,
      },
    });

    // Create a clean user object without sensitive data
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return NextResponse.json(
      { user: userResponse, message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    void logger.error(LogCategory.AUTH, "Registration error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

// Wrap handler with audit trail
export const POST = withAuditTrail(register, { entityType: "User" });
