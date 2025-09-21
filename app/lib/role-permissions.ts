// Role-based permissions configuration
import { Role } from "@/app/generated/prisma";

// Use Prisma Role enum as the canonical UserRole type
export type UserRole = Role;

export type PermissionModule =
  | "dashboard"
  | "pending-approvals"
  | "reports"
  | "payment-receipting"
  | "settings"
  | "job-cards"
  | "job-cards/large-scale"
  | "sealing-certification"
  | "notifications"
  | "valuations"
  | "setup";

// Action-level permission primitives
export type PermissionAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "print";

// Map modules to allowed actions per role (action-level permissions)
// Use string keys to avoid TS enum indexing issues with generated Prisma types
export const ROLE_ACTIONS: Partial<
  Record<string, Partial<Record<PermissionModule, PermissionAction[]>>>
> = {
  EXECUTIVE: { dashboard: ["read"], "pending-approvals": ["read", "approve"] },
  FINANCE: {
    dashboard: ["read"],
    reports: ["read"],
    "payment-receipting": ["read", "create"],
  },
  ADMIN: {
    dashboard: ["read"],
    reports: ["read"],
    settings: ["read", "update"],
    setup: ["read", "update"],
  },
  CEO: {
    dashboard: ["read"],
    "pending-approvals": ["read", "approve"],
  },
  DEPUTY_CEO: {
    dashboard: ["read"],
    "pending-approvals": ["read", "approve"],
  },
  SMALL_SCALE_ASSAYER: {
    dashboard: ["read"],
    "job-cards": ["read", "create", "update"],
    "payment-receipting": ["read"],
  },
  LARGE_SCALE_ASSAYER: {
    dashboard: ["read"],
    "job-cards/large-scale": ["read", "create", "update"],
    "payment-receipting": ["read", "create"],
  },
  SUPERADMIN: {
    dashboard: ["read"],
    "pending-approvals": ["read", "approve"],
    reports: ["read"],
    "payment-receipting": ["read", "create"],
    settings: ["read", "update"],
    "job-cards": ["read", "create", "update", "delete"],
    "job-cards/large-scale": ["read", "create", "update", "delete"],
    "sealing-certification": ["read", "create", "print"],
    notifications: ["read", "create"],
    valuations: ["read"],
    setup: ["read", "update"],
  },
};

// Define role permissions mapping
// Maintain module-level permissions for navigation convenience by deriving from ROLE_ACTIONS
export const ROLE_PERMISSIONS: Record<UserRole, PermissionModule[]> =
  Object.fromEntries(
    (Object.keys(ROLE_ACTIONS) as UserRole[]).map((r) => [
      r,
      Object.keys(ROLE_ACTIONS[r] || {}) as PermissionModule[],
    ])
  ) as Record<UserRole, PermissionModule[]>;

// Route to module mapping
export const ROUTE_MODULE_MAPPING: Record<string, PermissionModule> = {
  "/dashboard": "dashboard",
  "/setup/pending-approvals": "pending-approvals",
  "/reports": "reports",
  "/payment-receipting": "payment-receipting",
  "/settings": "settings",
  "/setup": "setup",
  "/job-cards": "job-cards",
  "/job-cards/large-scale": "job-cards/large-scale",
  "/sealing-certification": "sealing-certification",
  "/notifications": "notifications",
  "/valuations": "valuations",
};

/**
 * Check if a user role has permission to access a specific module
 */
export function hasPermission(
  userRole: UserRole,
  module: PermissionModule
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;

  // SUPERADMIN has access to everything
  if (userRole === "SUPERADMIN") return true;

  return permissions.includes(module);
}

/**
 * Check if a user role has permission to perform a specific action on a module
 */
export function hasActionPermission(
  userRole: UserRole,
  module: PermissionModule,
  action: PermissionAction
): boolean {
  // SUPERADMIN can do everything
  if (userRole === "SUPERADMIN") return true;

  const roleActions = ROLE_ACTIONS[userRole];
  if (!roleActions) return false;

  const actions = roleActions[module];
  if (!actions) return false;

  return actions.includes(action);
}

/**
 * Check if a user role can access a specific route
 */
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Handle dynamic routes by checking prefixes
  const module = getModuleFromRoute(route);
  if (!module) return false;

  return hasPermission(userRole, module);
}

/**
 * Get the module from a route path
 */
export function getModuleFromRoute(route: string): PermissionModule | null {
  // Direct mapping first
  if (ROUTE_MODULE_MAPPING[route]) {
    return ROUTE_MODULE_MAPPING[route];
  }

  // Check for route prefixes for dynamic routes
  if (route.startsWith("/job-cards/large-scale")) {
    return "job-cards/large-scale";
  }

  if (route.startsWith("/job-cards")) {
    return "job-cards";
  }

  if (route.startsWith("/setup")) {
    return "setup";
  }

  if (route.startsWith("/settings")) {
    return "settings";
  }

  if (route.startsWith("/reports")) {
    return "reports";
  }

  if (route.startsWith("/payment-receipting")) {
    return "payment-receipting";
  }

  if (route.startsWith("/sealing-certification")) {
    return "sealing-certification";
  }

  if (route.startsWith("/notifications")) {
    return "notifications";
  }

  if (route.startsWith("/valuations")) {
    return "valuations";
  }

  if (route.startsWith("/setup/pending-approvals")) {
    return "pending-approvals";
  }

  return null;
}

/**
 * Get allowed navigation items for a user role
 */
export function getAllowedNavItems(userRole: UserRole): PermissionModule[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Get default route for a user role (first allowed route)
 */
export function getDefaultRouteForRole(userRole: UserRole): string {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions || permissions.length === 0) return "/dashboard";

  // Always redirect to dashboard if it's available
  if (permissions.includes("dashboard")) return "/dashboard";

  // Otherwise return the first available permission
  const firstPermission = permissions[0];
  const routeEntry = Object.entries(ROUTE_MODULE_MAPPING).find(
    ([_, module]) => module === firstPermission
  );

  return routeEntry ? routeEntry[0] : "/dashboard";
}

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.keys(ROLE_PERMISSIONS).includes(role as UserRole);
}
