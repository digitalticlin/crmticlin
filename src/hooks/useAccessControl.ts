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

      // Se for admin ou manager, tem acesso a todos os funis da organização
      if (permissions.role === 'admin' || permissions.role === 'manager') {
        // Para admins/managers: primeiro buscar funis criados diretamente
        const { data: ownedFunnels, error: ownedError } = await supabase
          .from("funnels")
          .select("id")
          .eq("created_by_user_id", user.id);
          
        if (ownedError) {
          console.error('[useAccessControl] ❌ Erro ao buscar funis próprios:', ownedError);
          throw ownedError;
        }
        
        console.log('[useAccessControl] 📊 Funis próprios encontrados:', ownedFunnels?.length || 0);

        // Para admins: também buscar funis onde foram atribuídos membros da equipe
        if (permissions.role === 'admin') {
          const { data: teamMembers, error: teamError } = await supabase
            .from("profiles")
            .select("id")
            .eq("created_by_user_id", user.id);
            
          if (!teamError && teamMembers && teamMembers.length > 0) {
            const teamMemberIds = teamMembers.map(m => m.id);
            
            const { data: teamFunnels, error: teamFunnelsError } = await supabase
              .from("user_funnels")
              .select("funnel_id")
              .in("profile_id", teamMemberIds);
              
            if (!teamFunnelsError && teamFunnels) {
              const teamFunnelIds = teamFunnels.map(tf => tf.funnel_id);
              const allFunnelIds = [...(ownedFunnels?.map(f => f.id) || []), ...teamFunnelIds];
              return [...new Set(allFunnelIds)]; // Remove duplicates
            }
          }
        }
        
        return ownedFunnels?.map(f => f.id) || [];
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

      // Se for admin ou manager, tem acesso a todas as instâncias da organização
      if (permissions.role === 'admin' || permissions.role === 'manager') {
        // Para admins/managers: primeiro buscar instâncias criadas diretamente
        const { data: ownedWhatsApp, error: ownedError } = await supabase
          .from("whatsapp_instances")
          .select("id")
          .eq("created_by_user_id", user.id);
          
        if (ownedError) {
          console.error('[useAccessControl] ❌ Erro ao buscar instâncias próprias:', ownedError);
          throw ownedError;
        }

        // Para admins: também buscar instâncias onde foram atribuídos membros da equipe
        if (permissions.role === 'admin') {
          const { data: teamMembers, error: teamError } = await supabase
            .from("profiles")
            .select("id")
            .eq("created_by_user_id", user.id);
            
          if (!teamError && teamMembers && teamMembers.length > 0) {
            const teamMemberIds = teamMembers.map(m => m.id);
            
            const { data: teamWhatsApp, error: teamWhatsAppError } = await supabase
              .from("user_whatsapp_numbers")
              .select("whatsapp_number_id")
              .in("profile_id", teamMemberIds);
              
            if (!teamWhatsAppError && teamWhatsApp) {
              const teamWhatsAppIds = teamWhatsApp.map(tw => tw.whatsapp_number_id);
              const allWhatsAppIds = [...(ownedWhatsApp?.map(w => w.id) || []), ...teamWhatsAppIds];
              return [...new Set(allWhatsAppIds)]; // Remove duplicates
            }
          }
        }
        
        return ownedWhatsApp?.map(w => w.id) || [];
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