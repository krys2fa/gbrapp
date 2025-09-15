import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/prisma";
import { validateJWTUser } from "@/lib/jwt-user-validation";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Extract JWT token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Validate JWT and get user
    const userValidation = await validateJWTUser(token);
    if (!userValidation.success || !userValidation.user) {
      return NextResponse.json(
        { error: userValidation.error || "Authentication failed" },
        { status: 401 }
      );
    }

    const user = userValidation.user;

    // Get current user with password from database
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
      },
    });

    if (!userWithPassword) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userWithPassword.password
    );
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      console.warn(
        `Failed password change attempt for user ${user.email} (${user.id}) - incorrect current password`
      );

      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      userWithPassword.password
    );
    if (isSamePassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    // Log successful password change
    console.log(
      `Password successfully changed for user ${user.email} (${user.id})`
    );

    // Create audit trail entry
    try {
      await prisma.auditTrail.create({
        data: {
          action: "UPDATE", // Using existing ActionType enum value
          entityType: "User",
          entityId: user.id,
          userId: user.id,
          details: JSON.stringify({
            action: "PASSWORD_CHANGED",
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
            reason: "User initiated password change",
          }),
          ipAddress:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          timestamp: new Date(),
        },
      });
    } catch (auditError) {
      // Log audit error but don't fail the password change
      console.error(
        "Failed to create audit trail for password change:",
        auditError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password change error:", error);

    return NextResponse.json(
      {
        error: "Internal server error during password change",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
