
/**
 * 🚀 MIGRADO PARA USAR ROLECONTEXT
 *
 * Este hook agora é apenas um wrapper para manter compatibilidade
 * com código existente. Usa o RoleContext global ao invés de fazer
 * queries próprias.
 */

import { useRole } from "@/contexts/RoleContext";

export type UserRole = "admin" | "operational";

interface UserPermissions {
  canViewAllData: boolean;
  canDeleteData: boolean;
  canManageTeam: boolean;
  canAccessSettings: boolean;
  canManageFunnels: boolean;
  canManageWhatsApp: boolean;
  canViewReports: boolean;
  role: UserRole | null;
  allowedPages: string[];
}

export const useUserPermissions = () => {
  const { permissions: rolePermissions, role, loading } = useRole();

  // Mapeia as permissões do Context para o formato esperado
  const permissions: UserPermissions = {
    ...rolePermissions,
    role,
    allowedPages: role === 'admin'
      ? ["dashboard", "sales-funnel", "chat", "clients", "settings", "team", "ai-agents"]
      : ["dashboard", "sales-funnel", "chat", "clients"]
  };

  return { permissions, loading };
};
