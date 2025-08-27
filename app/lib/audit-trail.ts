import { ActionType } from "@/app/generated/prisma";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

interface AuditTrailParams {
  userId: string;
  action: ActionType;
  entityType: string;
  entityId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
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
    const { userId, action, entityType, entityId, details, ipAddress, userAgent, metadata } = params;
    
    // Format details and metadata as JSON strings if they are objects
    const formattedDetails = details ? 
      (typeof details === 'string' ? details : JSON.stringify(details)) : 
      null;
    
    const formattedMetadata = metadata ? 
      (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : 
      null;
    
    return prisma.auditTrail.create({
      data: {
        userId,
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

  /**
   * Gets audit trail entries for a specific entity
   * 
   * @param entityType The type of entity
   * @param entityId The ID of the entity
   * @returns The audit trail entries for the entity
   */
  static async getAuditTrailForEntity(entityType: string, entityId: string) {
    return prisma.auditTrail.findMany({
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
        timestamp: 'desc',
      },
    });
  }

  /**
   * Gets audit trail entries for a specific user
   * 
   * @param userId The ID of the user
   * @returns The audit trail entries for the user
   */
  static async getAuditTrailForUser(userId: string) {
    return prisma.auditTrail.findMany({
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
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
    
    const [total, records] = await Promise.all([
      prisma.auditTrail.count(),
      prisma.auditTrail.findMany({
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
          timestamp: 'desc',
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
  }
}
