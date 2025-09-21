import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  extractTokenFromReq,
  validateTokenAndLoadUser,
} from "@/app/lib/auth-utils";

/**
 * GET handler for fetching current user's profile data
 */
export async function GET(req: NextRequest) {
  try {
    // Extract token (header or cookie) and validate + load user
    const token = await extractTokenFromReq(req);
    const validation = await validateTokenAndLoadUser(token);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.statusCode || 401 }
      );
    }

    // Fetch complete user profile from database
    const user = await prisma.user.findUnique({
      where: { id: validation.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailNotifications: true,
        smsNotifications: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate additional profile information
    const profile = {
      ...user,
      // Account age in days
      accountAge: Math.floor(
        (new Date().getTime() - user.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      ),

      // Last login information
      lastLoginFormatted: user.lastLogin ? user.lastLogin.toISOString() : null,

      // Profile completion percentage
      profileCompletion: calculateProfileCompletion(user),
    };

    return NextResponse.json({
      success: true,
      user: profile,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Calculate profile completion percentage based on filled fields
 */
function calculateProfileCompletion(user: any): number {
  const requiredFields = ["name", "email"];
  const optionalFields = ["phone"];

  let completed = 0;
  const total = requiredFields.length + optionalFields.length;

  // Check required fields
  requiredFields.forEach((field) => {
    if (user[field] && user[field].trim() !== "") {
      completed += 1;
    }
  });

  // Check optional fields
  optionalFields.forEach((field) => {
    if (user[field] && user[field].trim() !== "") {
      completed += 1;
    }
  });

  return Math.round((completed / total) * 100);
}
