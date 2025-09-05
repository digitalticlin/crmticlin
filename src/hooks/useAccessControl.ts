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
    queryKey: ["user-funnel-access", user?.id, permissions.role],
    queryFn: async () => {
      if (!user?.id) return [];

      console.log('[useAccessControl] 🔍 Buscando acessos a funis:', {
        userId: user.id,
        role: permissions.role
      });

      // Se for admin, tem acesso a todos os funis da organização
      if (permissions.role === 'admin') {
        // Para admins: buscar TODOS os funis (sem filtro de created_by_user_id)
        const { data: allFunnels, error: funnelsError } = await supabase
          .from("funnels")
          .select("id");
          
        if (funnelsError) {
          console.error('[useAccessControl] ❌ Erro ao buscar todos os funis:', funnelsError);
          throw funnelsError;
        }
        
        console.log('[useAccessControl] 📊 Todos os funis encontrados (admin):', allFunnels?.length || 0);
        return allFunnels?.map(f => f.id) || [];
      }

      // Para operacionais, buscar apenas funis atribuídos
      console.log('[useAccessControl] 👤 Buscando funis atribuídos para usuário operacional:', user.id);
      
      const { data: userFunnelAccess, error } = await supabase
        .from("user_funnels")
        .select("funnel_id")
        .eq("profile_id", user.id);

      if (error) {
        console.error('[useAccessControl] ❌ Erro ao buscar funis atribuídos:', error);
        throw error;
      }
      
      console.log('[useAccessControl] 📊 Funis atribuídos encontrados:', userFunnelAccess?.length || 0);
      return userFunnelAccess?.map(uf => uf.funnel_id) || [];
    },
    enabled: !!user?.id && !permissionsLoading && !!permissions.role,
  });

  // Buscar instâncias WhatsApp que o usuário tem acesso
  const { data: userWhatsApp = [], isLoading: whatsappLoading } = useQuery({
    queryKey: ["user-whatsapp-access", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Se for admin, tem acesso a todas as instâncias da organização
      if (permissions.role === 'admin') {
        // Para admins: buscar TODAS as instâncias (sem filtro de created_by_user_id)
        const { data: allWhatsApp, error: whatsappError } = await supabase
          .from("whatsapp_instances")
          .select("id");
          
        if (whatsappError) {
          console.error('[useAccessControl] ❌ Erro ao buscar todas instâncias:', whatsappError);
          throw whatsappError;
        }

        console.log('[useAccessControl] 📊 Todas instâncias encontradas (admin):', allWhatsApp?.length || 0);
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
    
    // Admins têm acesso a todos os funis
    if (permissions.role === 'admin') {
      return true;
    }
    
    // Operacionais só têm acesso aos funis atribuídos
    return userFunnels.includes(funnelId);
  };

  const canAccessWhatsApp = (whatsappId: string): boolean => {
    if (!permissions.role) return false;
    
    // Admins têm acesso a todas as instâncias
    if (permissions.role === 'admin') {
      return true;
    }
    
    // Operacionais só têm acesso às instâncias atribuídas
    return userWhatsApp.includes(whatsappId);
  };

  const canManageFunnel = (funnelId: string): boolean => {
    if (!permissions.role) return false;
    
    // Apenas admins podem gerenciar funis
    if (permissions.role === 'admin') {
      return true;
    }
    
    return false;
  };

  const canManageWhatsApp = (whatsappId: string): boolean => {
    if (!permissions.role) return false;
    
    // Apenas admins podem gerenciar instâncias WhatsApp
    if (permissions.role === 'admin') {
      return true;
    }
    
    return false;
  };

  return {
    canAccessFunnel,
    canAccessWhatsApp,
    canManageFunnel,
    canManageWhatsApp,
    canViewAllFunnels: permissions.role === 'admin',
    canViewAllWhatsApp: permissions.role === 'admin',
    userFunnels,
    userWhatsApp,
    isLoading,
  };
}; 