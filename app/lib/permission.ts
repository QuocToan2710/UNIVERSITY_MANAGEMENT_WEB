import type { User, Permission } from "../types/management";

/**
 * Normalizes an endpoint path for consistent pattern matching
 */
function normalizePath(path?: string): string {
  if (!path) return "";
  let clean = path.trim().toLowerCase();
  if (!clean.startsWith("/")) clean = "/" + clean;
  if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
  return clean;
}

/**
 * Matches an Ant-style path pattern (e.g. /students/** or /rooms/*) against a target path
 */
export function matchEndpointPattern(pattern?: string, targetPath?: string): boolean {
  if (!pattern || !targetPath) return false;
  if (pattern === "*" || pattern === "/**" || targetPath === "*" || targetPath === "/**") return true;

  const normPattern = normalizePath(pattern);
  const normTarget = normalizePath(targetPath);

  if (normPattern === normTarget) return true;

  // Pattern with /** (matches current path and all subpaths)
  if (normPattern.endsWith("/**")) {
    const basePattern = normPattern.slice(0, -3);
    return normTarget === basePattern || normTarget.startsWith(basePattern + "/");
  }

  // Target with /** (matches current path and all subpaths)
  if (normTarget.endsWith("/**")) {
    const baseTarget = normTarget.slice(0, -3);
    return normPattern === baseTarget || normPattern.startsWith(baseTarget + "/");
  }

  // Pattern with /* (matches one level of subpath)
  if (normPattern.endsWith("/*")) {
    const basePattern = normPattern.slice(0, -2);
    if (!normTarget.startsWith(basePattern + "/")) return false;
    const remaining = normTarget.slice(basePattern.length + 1);
    return !remaining.includes("/");
  }

  // Target with /*
  if (normTarget.endsWith("/*")) {
    const baseTarget = normTarget.slice(0, -2);
    if (!normPattern.startsWith(baseTarget + "/")) return false;
    const remaining = normPattern.slice(baseTarget.length + 1);
    return !remaining.includes("/");
  }

  // Convert custom path parameter like /students/{id} to regex
  const toRegex = (str: string) =>
    "^" + str.replace(/{[^}]+}/g, "[^/]+").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]+") + "$";

  try {
    if (new RegExp(toRegex(normPattern)).test(normTarget)) return true;
    if (new RegExp(toRegex(normTarget)).test(normPattern)) return true;
  } catch {
    // fallback
  }

  return normPattern === normTarget;
}

/**
 * Checks if user has ADMIN authority
 */
export function isAdmin(user: User | null): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((r) => {
    const code = (r.roleCode || r.name || "").toUpperCase();
    return code === "ADMIN" || code === "ROLE_ADMIN";
  });
}

/**
 * Checks if user has TEACHER authority
 */
export function isTeacher(user: User | null): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((r) => {
    const code = (r.roleCode || r.name || "").toUpperCase();
    return code === "TEACHER" || code === "ROLE_TEACHER";
  });
}

/**
 * Checks if user has STUDENT authority
 */
export function isStudent(user: User | null): boolean {
  if (!user || !user.roles) return false;
  return user.roles.some((r) => {
    const code = (r.roleCode || r.name || "").toUpperCase();
    return code === "STUDENT" || code === "ROLE_STUDENT";
  });
}

/**
 * Checks if user has any of the specified roles
 */
export function hasRole(user: User | null, ...roles: string[]): boolean {
  if (!user || !user.roles) return false;
  if (roles.length === 0) return true;

  const normalizedUserRoles = user.roles.flatMap((r) => {
    const raw = (r.roleCode || r.name || "").toUpperCase();
    return [raw, raw.replace(/^ROLE_/, "")];
  });

  return roles.some((role) => {
    const cleanRole = role.toUpperCase().replace(/^ROLE_/, "");
    return normalizedUserRoles.includes(cleanRole) || normalizedUserRoles.includes(`ROLE_${cleanRole}`);
  });
}

/**
 * Checks if user has permission for a specific endpoint and HTTP method
 */
export function hasPermission(
  user: User | null,
  requiredEndpoint?: string,
  requiredMethod: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "*" = "GET"
): boolean {
  if (!user) return false;
  if (!requiredEndpoint) return true;
  if (isAdmin(user)) return true;

  const roles = user.roles || [];
  const reqMethodUpper = requiredMethod.toUpperCase();

  for (const role of roles) {
    const permissions: Permission[] = role.permissions || [];
    for (const p of permissions) {
      if (!p.endpoint) continue;

      const pMethod = (p.method || "*").toUpperCase();
      const matchMethod = pMethod === "*" || pMethod === reqMethodUpper;

      if (matchMethod && matchEndpointPattern(p.endpoint, requiredEndpoint)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if user has any permission in a list of requirements
 */
export function hasAnyPermission(
  user: User | null,
  requirements: Array<{ endpoint: string; method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "*" }>
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return requirements.some((req) => hasPermission(user, req.endpoint, req.method || "GET"));
}

/**
 * Checks if user has all permissions in a list of requirements
 */
export function hasAllPermissions(
  user: User | null,
  requirements: Array<{ endpoint: string; method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "*" }>
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return requirements.every((req) => hasPermission(user, req.endpoint, req.method || "GET"));
}

/**
 * Checks access to a navigation item based on either requiredEndpoint or allowedRoles
 */
export function canAccessNavItem(
  user: User | null,
  item: {
    to?: string;
    requiredEndpoint?: string;
    requiredMethod?: "GET" | "POST" | "PUT" | "DELETE" | "*";
    allowedRoles?: string[];
  }
): boolean {
  // If no restrictions specified, allow immediately (e.g. public dashboard or public routes)
  if (!item.requiredEndpoint && (!item.allowedRoles || item.allowedRoles.length === 0)) {
    return true;
  }

  if (!user) return false;
  if (isAdmin(user)) return true;

  // Check endpoint permission first (highest priority)
  if (item.requiredEndpoint) {
    if (hasPermission(user, item.requiredEndpoint, item.requiredMethod || "GET")) {
      return true;
    }
  }

  // Fallback to role-based check
  if (item.allowedRoles && item.allowedRoles.length > 0) {
    if (hasRole(user, ...item.allowedRoles)) {
      return true;
    }
  }

  return false;
}
