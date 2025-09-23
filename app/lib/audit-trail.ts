import { ActionType } from "@/app/generated/prisma";
import { logger, LogCategory } from "@/lib/logger";

interface AuditTrailParams {
  userId: string;
  action: ActionType;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit trail service for tracking user actions in the application
 */
export class AuditTrailService {
  /**
   * Creates a new audit trail entry
   *
   * @param params The audit trail parameters
   * @returns The created audit trail entry
   */
  static async createAuditTrail(params: AuditTrailParams) {
    const {
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
      metadata,
    } = params;

    // Format details and metadata as JSON strings if they are objects
    const formattedDetails = details
      ? typeof details === "string"
        ? details
        : JSON.stringify(details)
      : null;

    const formattedMetadata = metadata
      ? typeof metadata === "string"
        ? metadata
        : JSON.stringify(metadata)
      : null;

    try {
      // Lazily import prisma to avoid pulling Node-only modules into edge runtime
      let prismaClient: any;
      try {
        const mod = await import("@/app/lib/prisma");
        prismaClient = mod.prisma;
      } catch (err) {
        prismaClient = undefined;
      }

      // First check if the user exists (if prisma is available)
      const userExists = prismaClient
        ? await prismaClient.user.findUnique({
            where: { id: userId },
            select: { id: true },
          })
        : null;

      // If user doesn't exist or userId is "unknown", use a special system user ID or skip audit
      if (!userExists && userId !== "unknown") {
        await logger.warn(
          LogCategory.AUDIT,
          `Audit trail skipped: User ID ${userId} not found`,
          { userId }
        );
        return null;
      }

      // Only create the audit trail if user exists or if we're using a special system user
      if (userExists || userId === "unknown") {
        if (!prismaClient) return null;

        return await prismaClient.auditTrail.create({
          data: {
            userId: userExists
              ? userId
              : "00000000-0000-0000-0000-000000000000", // Use a system user ID for unknown
            action,
            entityType,
            entityId,
            details: formattedDetails,
            ipAddress,
            userAgent,
            metadata: formattedMetadata,
          },
        });
      }

      return null;
    } catch (error) {
      await logger.error(LogCategory.AUDIT, "Error creating audit trail", {
        error: String(error),
      });
      return null; // Don't let audit trail errors break the application
    }
  }

  /**
   * Gets audit trail entries for a specific entity
   *
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @returns The audit trail entries for the entity
   */
  static async getAuditTrailForEntity(entityType: string, entityId: string) {
    try {
      const mod = await import("@/app/lib/prisma");
      const prismaClient = mod.prisma;

      return await prismaClient.auditTrail.findMany({
        where: {
          entityType,
          entityId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
      });
    } catch (err) {
      return [];
    }
  }

  /**
   * Gets audit trail entries for a specific user
   *
   * @param userId The ID of the user
   * @returns The audit trail entries for the user
   */
  static async getAuditTrailForUser(userId: string) {
    try {
      const mod = await import("@/app/lib/prisma");
      const prismaClient = mod.prisma;

      return await prismaClient.auditTrail.findMany({
        where: {
          userId,
        },
        orderBy: {
          timestamp: "desc",
        },
      });
    } catch (err) {
      return [];
    }
  }

  /**
   * Gets all audit trail entries with pagination
   *
   * @param page The page number
   * @param pageSize The page size
   * @returns The audit trail entries for the page
   */
  static async getAllAuditTrail(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;

    try {
      const mod = await import("@/app/lib/prisma");
      const prismaClient = mod.prisma;

      const [total, records] = await Promise.all([
        prismaClient.auditTrail.count(),
        prismaClient.auditTrail.findMany({
          skip,
          take: pageSize,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            timestamp: "desc",
          },
        }),
      ]);

      return {
        records,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (err) {
      return {
        records: [],
        pagination: { total: 0, page, pageSize, totalPages: 0 },
      };
    }
  }
}
