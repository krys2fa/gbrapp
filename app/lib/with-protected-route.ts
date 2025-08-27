import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/app/lib/with-auth';
import { withAuditTrail } from '@/app/lib/with-audit-trail';
import { Role } from '@/app/generated/prisma';

interface ApiHandlerOptions {
  entityType: string;
  requiredRoles?: Role[];
}

/**
 * Higher-order function that combines authentication, authorization, and audit trail
 * functionality for API routes.
 * 
 * @param handler The original route handler
 * @param options Configuration options including entity type and required roles
 * @returns The wrapped handler with auth and audit trail
 */
export function withProtectedRoute<T = any>(
  handler: (req: NextRequest, params: any) => Promise<NextResponse>,
  options: ApiHandlerOptions
) {
  const { entityType, requiredRoles = [] } = options;
  
  // First apply authentication/authorization
  const authHandler = withAuth(handler, requiredRoles);
  
  // Then apply audit trail on top
  return withAuditTrail(authHandler, { entityType });
}
