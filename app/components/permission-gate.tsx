import type { ReactNode } from "react";
import { getCachedUser } from "../lib/auth";
import { hasPermission, hasRole } from "../lib/permission";
import type { User } from "../types/management";

export interface PermissionGateProps {
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "*";
  roles?: string[];
  fallback?: ReactNode;
  children: ReactNode;
  user?: User | null;
}

/**
 * Declarative component to conditionally render children based on endpoint permissions or roles
 */
export function PermissionGate({
  endpoint,
  method = "GET",
  roles,
  fallback = null,
  children,
  user,
}: PermissionGateProps) {
  const currentUser = user !== undefined ? user : getCachedUser<User>();

  if (!currentUser) {
    return <>{fallback}</>;
  }

  if (roles && roles.length > 0) {
    if (!hasRole(currentUser, ...roles)) {
      return <>{fallback}</>;
    }
  }

  if (endpoint) {
    if (!hasPermission(currentUser, endpoint, method)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
