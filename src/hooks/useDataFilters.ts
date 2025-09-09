import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

interface DataFilters {
  // Para leads
  leadsFilter: any;
  // Para funis
  funnelsFilter: any;
  // Para instâncias WhatsApp
  whatsappFilter: any;
  // Para mensagens
  messagesFilter: any;
  // Role atual
  role: "admin" | "operational" | null;
  // Loading state
  loading: boolean;
}

/**
 * 🎯 HOOK DE FILTROS CONDICIONAIS
 * - Admin: Vê dados onde created_by_user_id = seu ID
 * - Operacional: Vê dados atribuídos via user_funnels e user_whatsapp_numbers
 */
export const useDataFilters = (): DataFilters => {
  const { role, loading: roleLoading } = useUserRole();
  const [filters, setFilters] = useState<DataFilters>({
    leadsFilter: null,
    funnelsFilter: null,
    whatsappFilter: null,
    messagesFilter: null,
    role: null,
    loading: true
  });

  useEffect(() => {
    const setupFilters = async () => {
      if (roleLoading || !role) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('[useDataFilters] 🔍 Configurando filtros para role:', role, 'user:', user.id);

        if (role === 'admin') {
          // 👑 ADMIN: Vê tudo que criou
          const adminFilters = {
            leadsFilter: { created_by_user_id: user.id },
            funnelsFilter: { created_by_user_id: user.id },
            whatsappFilter: { created_by_user_id: user.id },
            messagesFilter: { 'leads.created_by_user_id': user.id },
            role: 'admin' as const,
            loading: false
          };
          
          console.log('[useDataFilters] 👑 Filtros ADMIN configurados');
          setFilters(adminFilters);
          
        } else if (role === 'operational') {
          // 🎯 OPERACIONAL: Buscar atribuições
          console.log('[useDataFilters] 🎯 Buscando atribuições operacionais...');
          
          // Buscar funis atribuídos
          const { data: userFunnels } = await supabase
            .from('user_funnels')
            .select('funnel_id')
            .eq('profile_id', user.id)
            .eq('can_view', true);

          // Buscar instâncias WhatsApp atribuídas
          const { data: userWhatsApp } = await supabase
            .from('user_whatsapp_numbers')
            .select('whatsapp_number_id')
            .eq('profile_id', user.id)
            .eq('can_view', true);

          const funnelIds = userFunnels?.map(uf => uf.funnel_id) || [];
          const whatsappIds = userWhatsApp?.map(uw => uw.whatsapp_number_id) || [];

          const operationalFilters = {
            leadsFilter: { owner_id: user.id }, // Leads atribuídos diretamente
            funnelsFilter: funnelIds.length > 0 ? { id: { in: funnelIds } } : { id: 'no-access' },
            whatsappFilter: whatsappIds.length > 0 ? { id: { in: whatsappIds } } : { id: 'no-access' },
            messagesFilter: { 'leads.owner_id': user.id },
            role: 'operational' as const,
            loading: false
          };

          console.log('[useDataFilters] 🎯 Filtros OPERACIONAL configurados:', {
            funnelIds: funnelIds.length,
            whatsappIds: whatsappIds.length
          });
          
          setFilters(operationalFilters);
        }

      } catch (error) {
        console.error('[useDataFilters] ❌ Erro ao configurar filtros:', error);
        setFilters(prev => ({ ...prev, loading: false }));
      }
    };

    setupFilters();
  }, [role, roleLoading]);

  return filters;
};