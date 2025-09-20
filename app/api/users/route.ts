import { Role } from "@/app/generated/prisma";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  validateAPIPermission,
  createUnauthorizedResponse,
} from "@/app/lib/api-validation";

/**
 * GET handler for fetching all users
 * This route should be restricted to admin users only
 */
async function getUsers(req: NextRequest) {
  try {
    // Validate user has settings permission (admin functionality)
    const validation = await validateAPIPermission(req, "settings");
    if (!validation.success) {
      return createUnauthorizedResponse(
        validation.error!,
        validation.statusCode
      );
    }

    // Extract query parameters for filtering
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    // Build where clause based on filters
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error fetching users" },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new user
 * This route should be restricted to admin users only
 */
async function createUser(req: NextRequest) {
  try {
    // Validate user has settings permission (admin functionality)
    const validation = await validateAPIPermission(req, "settings");
    if (!validation.success) {
      return createUnauthorizedResponse(
        validation.error!,
        validation.statusCode
      );
    }

    const { email, password, name, phone, role, isActive } = await req.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(Role).includes(role)) {
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

    // Create user (handle unique constraint races)
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    } catch (e: any) {
      // If another request created the same email concurrently, return 409
      if (e && typeof e === "object" && (e as any).code === "P2002") {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      throw e;
    }

    // Create a clean user object without sensitive data
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Error creating user" }, { status: 500 });
  }
}

// Wrap handlers with audit trail
export const GET = withAuditTrail(getUsers, { entityType: "User" });
export const POST = withAuditTrail(createUser, { entityType: "User" });
