import { prisma } from "@/app/lib/prisma";
import { withAuditTrail } from "@/app/lib/with-audit-trail";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

/**
 * GET handler for fetching a single user
 */
async function getUser(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    // Get user by ID
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Error fetching user" }, { status: 500 });
  }
}

/**
 * PUT handler for updating a user
 */
async function updateUser(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const { email, password, name, role, isActive } = await req.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (email !== undefined && email !== existingUser.email) {
      // Check if email is already in use by another user
      const emailInUse = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: "Email is already in use by another user" },
          { status: 409 }
        );
      }

      updateData.email = email;
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (name !== undefined) {
      updateData.name = name;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}

/**
 * DELETE handler for deleting a user
 */
async function deleteUser(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}

// Wrap handlers with audit trail
export const GET = withAuditTrail(getUser, { entityType: "User" });
export const PUT = withAuditTrail(updateUser, { entityType: "User" });
export const DELETE = withAuditTrail(deleteUser, { entityType: "User" });
