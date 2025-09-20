// Role-based permissions configuration
export type UserRole =
  | "EXECUTIVE"
  | "FINANCE"
  | "ADMIN"
  | "SMALL_SCALE_ASSAYER"
  | "LARGE_SCALE_ASSAYER"
  | "SUPERADMIN";

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

// Define role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, PermissionModule[]> = {
  EXECUTIVE: ["dashboard", "pending-approvals"],
  FINANCE: ["dashboard", "reports", "payment-receipting"],
  ADMIN: ["dashboard", "reports", "settings", "setup"],
  SMALL_SCALE_ASSAYER: ["dashboard", "job-cards"],
  LARGE_SCALE_ASSAYER: ["dashboard", "job-cards/large-scale"],
  SUPERADMIN: [
    "dashboard",
    "pending-approvals",
    "reports",
    "payment-receipting",
    "settings",
    "job-cards",
    "job-cards/large-scale",
    "sealing-certification",
    "notifications",
    "valuations",
    "setup",
  ],
};

// Route to module mapping
export const ROUTE_MODULE_MAPPING: Record<string, PermissionModule> = {
  "/dashboard": "dashboard",
  "/weekly-prices/pending": "pending-approvals",
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

  if (route.startsWith("/weekly-prices/pending")) {
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
