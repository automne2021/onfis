export const CANONICAL_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE"] as const;

export type CanonicalRole = (typeof CANONICAL_ROLES)[number];

export function normalizeRole(value: unknown): CanonicalRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/[\s-]+/g, "_").toUpperCase();

  if (normalized === "SUPERADMIN") {
    return "SUPER_ADMIN";
  }

  if (CANONICAL_ROLES.includes(normalized as CanonicalRole)) {
    return normalized as CanonicalRole;
  }

  return null;
}