import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Role } from "@/app/generated/prisma";
import * as bcrypt from "bcryptjs";
import { logger, LogCategory } from "@/lib/logger";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Basic authentication check - you should enhance this
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== "Bearer your-secret-key") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    void logger.info(LogCategory.DATABASE, "Starting database seeding via API");

    // Check if database is already seeded
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({
        message: "Database appears to already be seeded",
        userCount: existingUsers,
      });
    }

    // Run the same seeding logic as your seed.ts file
    await runSeedLogic();

    return NextResponse.json({
      message: "Database seeded successfully!",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    void logger.error(LogCategory.DATABASE, "Seeding error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Seeding failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function runSeedLogic() {
  void logger.info(LogCategory.DATABASE, "Seeding database via API");

  // Create users with different roles
  const adminPassword = await bcrypt.hash("admin123", 10);

  // Create system user for audit trails with a fixed ID
  const systemUserId = "00000000-0000-0000-0000-000000000000";

  const existingSystemUser = await prisma.user.findUnique({
    where: { id: systemUserId },
  });

  if (!existingSystemUser) {
    await prisma.user.create({
      data: {
        id: systemUserId,
        name: "System",
        email: "system@gbrapp.com",
        password: await bcrypt.hash("not-a-real-password", 10),
        role: Role.SUPERADMIN,
        isActive: true,
      },
    });
    void logger.info(
      LogCategory.DATABASE,
      "Created system user for audit trails"
    );
  }

  // Create admin user
  await prisma.user.upsert({
    where: { email: "admin@gbrapp.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@gbrapp.com",
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  void logger.info(LogCategory.DATABASE, "Seeding completed via API");
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST to seed database." },
    { status: 405 }
  );
}
