import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type PermissionKey =
  | "canAccessAdmin"
  | "canEditBrands"
  | "canEditVehicles"
  | "canDeleteBrands"
  | "canDeleteVehicles"
  | "canImport"
  | "canManageUsers"
  | "canManageRoles"
  | "canManageDealerships"
  | "canManageSite";

export async function requirePermission(permission: PermissionKey) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: "Non autorisé", status: 401 as const };
  }

  if (!session.user[permission]) {
    return { error: "Permissions insuffisantes", status: 403 as const };
  }

  return { session };
}
