
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "operational" | "manager";

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
  const [permissions, setPermissions] = useState<UserPermissions>({
    canViewAllData: false,
    canDeleteData: false,
    canManageTeam: false,
    canAccessSettings: false,
    canManageFunnels: false,
    canManageWhatsApp: false,
    canViewReports: false,
    role: null,
    allowedPages: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        const role = profile.role as UserRole;
        let newPermissions: UserPermissions;

        switch (role) {
          case "admin":
            // Admin: Full access except they cannot create super-admin accounts
            newPermissions = {
              canViewAllData: true,
              canDeleteData: true,
              canManageTeam: true,
              canAccessSettings: true,
              canManageFunnels: true,
              canManageWhatsApp: true,
              canViewReports: true,
              role,
              allowedPages: ["dashboard", "sales-funnel", "chat", "clients", "settings", "team", "ai-agents"]
            };
            break;
          case "manager":
            // Manager: Can manage most things but not team members
            newPermissions = {
              canViewAllData: true,
              canDeleteData: true,
              canManageTeam: false,
              canAccessSettings: true,
              canManageFunnels: true,
              canManageWhatsApp: true,
              canViewReports: true,
              role,
              allowedPages: ["dashboard", "sales-funnel", "chat", "clients", "settings", "ai-agents"]
            };
            break;
          case "operational":
            // Operational: Limited access to assigned resources only
            newPermissions = {
              canViewAllData: false,
              canDeleteData: false,
              canManageTeam: false,
              canAccessSettings: false,
              canManageFunnels: false,
              canManageWhatsApp: false,
              canViewReports: false,
              role,
              allowedPages: ["dashboard", "sales-funnel", "chat", "clients"]
            };
            break;
          default:
            newPermissions = {
              canViewAllData: false,
              canDeleteData: false,
              canManageTeam: false,
              canAccessSettings: false,
              canManageFunnels: false,
              canManageWhatsApp: false,
              canViewReports: false,
              role: null,
              allowedPages: []
            };
        }

        setPermissions(newPermissions);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, []);

  return { permissions, loading };
};
