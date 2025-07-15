import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions } from "./useUserPermissions";

export interface AccessControl {
  canAccessFunnel: (funnelId: string) => boolean;
  canAccessWhatsApp: (whatsappId: string) => boolean;
  canManageFunnel: (funnelId: string) => boolean;
  canManageWhatsApp: (whatsappId: string) => boolean;
  canViewAllFunnels: boolean;
  canViewAllWhatsApp: boolean;
  userFunnels: string[];
  userWhatsApp: string[];
  isLoading: boolean;
}

export const useAccessControl = (): AccessControl => {
  const { user } = useAuth();
  const { permissions, loading: permissionsLoading } = useUserPermissions();

  // Buscar funis que o usuário tem acesso
  const { data: userFunnels = [], isLoading: funnelsLoading } = useQuery({
    queryKey: ["user-funnel-access", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Se for admin ou manager, tem acesso a todos os funis
      if (permissions.role === 'admin' || permissions.role === 'manager') {
        const { data: allFunnels, error } = await supabase
          .from("funnels")
          .select("id")
          .eq("created_by_user_id", user.id);

        if (error) throw error;
        return allFunnels?.map(f => f.id) || [];
      }

      // Para operacionais, buscar apenas funis atribuídos
      const { data: userFunnelAccess, error } = await supabase
        .from("user_funnels")
        .select("funnel_id")
        .eq("profile_id", user.id);

      if (error) throw error;
      return userFunnelAccess?.map(uf => uf.funnel_id) || [];
    },
    enabled: !!user?.id && !permissionsLoading && !!permissions.role,
  });

  // Buscar instâncias WhatsApp que o usuário tem acesso
  const { data: userWhatsApp = [], isLoading: whatsappLoading } = useQuery({
    queryKey: ["user-whatsapp-access", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Se for admin ou manager, tem acesso a todas as instâncias
      if (permissions.role === 'admin' || permissions.role === 'manager') {
        const { data: allWhatsApp, error } = await supabase
          .from("whatsapp_instances")
          .select("id")
          .eq("created_by_user_id", user.id);

        if (error) throw error;
        return allWhatsApp?.map(w => w.id) || [];
      }

      // Para operacionais, buscar apenas instâncias atribuídas
      const { data: userWhatsAppAccess, error } = await supabase
        .from("user_whatsapp_numbers")
        .select("whatsapp_number_id")
        .eq("profile_id", user.id);

      if (error) throw error;
      return userWhatsAppAccess?.map(uw => uw.whatsapp_number_id) || [];
    },
    enabled: !!user?.id && !permissionsLoading && !!permissions.role,
  });

  const isLoading = permissionsLoading || funnelsLoading || whatsappLoading;

  const canAccessFunnel = (funnelId: string): boolean => {
    if (!permissions.role) return false;
    
    // Admins e managers têm acesso a todos os funis
    if (permissions.role === 'admin' || permissions.role === 'manager') {
      return true;
    }
    
    // Operacionais só têm acesso aos funis atribuídos
    return userFunnels.includes(funnelId);
  };

  const canAccessWhatsApp = (whatsappId: string): boolean => {
    if (!permissions.role) return false;
    
    // Admins e managers têm acesso a todas as instâncias
    if (permissions.role === 'admin' || permissions.role === 'manager') {
      return true;
    }
    
    // Operacionais só têm acesso às instâncias atribuídas
    return userWhatsApp.includes(whatsappId);
  };

  const canManageFunnel = (funnelId: string): boolean => {
    if (!permissions.role) return false;
    
    // Apenas admins e managers podem gerenciar funis
    if (permissions.role === 'admin' || permissions.role === 'manager') {
      return true;
    }
    
    return false;
  };

  const canManageWhatsApp = (whatsappId: string): boolean => {
    if (!permissions.role) return false;
    
    // Apenas admins e managers podem gerenciar instâncias WhatsApp
    if (permissions.role === 'admin' || permissions.role === 'manager') {
      return true;
    }
    
    return false;
  };

  return {
    canAccessFunnel,
    canAccessWhatsApp,
    canManageFunnel,
    canManageWhatsApp,
    canViewAllFunnels: permissions.role === 'admin' || permissions.role === 'manager',
    canViewAllWhatsApp: permissions.role === 'admin' || permissions.role === 'manager',
    userFunnels,
    userWhatsApp,
    isLoading,
  };
}; 