import {
  type UserRole,
  type PermissionModule,
  getModuleFromRoute,
  getDefaultRouteForRole,
  hasPermission,
} from "./role-permissions";

export interface EvaluateResult {
  shouldRedirect: boolean;
  redirectTo?: string;
  message?: string | null;
  module?: PermissionModule | null;
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function humanizeModule(module: PermissionModule | null | undefined) {
  if (!module) return "this page";
  const map: Record<string, string> = {
    setup: "Settings",
    "job-cards": "Job Cards",
    "job-cards/large-scale": "Large-scale Job Cards",
    dashboard: "Dashboard",
    reports: "Reports",
    "payment-receipting": "Payments",
    "sealing-certification": "Sealing & Certification",
    notifications: "Notifications",
    valuations: "Valuations",
    "pending-approvals": "Pending Approvals",
    settings: "Settings",
  };

  return map[module] || capitalize(module.replace(/-/g, " "));
}

export function humanizeRoute(route: string | undefined) {
  if (!route) return "Dashboard";
  // Try to infer module and humanize it
  const module = getModuleFromRoute(route);
  if (module) return humanizeModule(module);
  // Fallback: use last segment
  const parts = route.split("/").filter(Boolean);
  if (parts.length === 0) return "Dashboard";
  return capitalize(parts[parts.length - 1]);
}

export function evaluateRedirect(
  userRole: UserRole,
  route: string,
  requiredPermissions: PermissionModule[] = []
): EvaluateResult {
  // Determine module either from requiredPermissions or route
  const module =
    requiredPermissions && requiredPermissions.length > 0
      ? requiredPermissions[0]
      : getModuleFromRoute(route);

  if (!module) return { shouldRedirect: false, module: null };

  if (hasPermission(userRole, module)) {
    return { shouldRedirect: false, module };
  }

  const redirectTo = getDefaultRouteForRole(userRole) || "/dashboard";
  const message = `You don't have access to ${humanizeModule(
    module
  )} — redirecting you to ${humanizeRoute(redirectTo)}`;

  return {
    shouldRedirect: true,
    redirectTo,
    message,
    module,
  };
}

export default evaluateRedirect;

// Re-export server-side auth helpers for backward compatibility.
// These live in a server-only module to avoid pulling server deps into client code.
export {
  extractTokenFromReq,
  validateTokenAndLoadUser,
  verifyTokenPayload,
} from "./auth-server";
