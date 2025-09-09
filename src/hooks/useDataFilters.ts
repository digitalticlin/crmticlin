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
          console.log('[useDataFilters] 🎯 Buscando atribuições operacionais para USER ID:', user.id);
          console.log('[useDataFilters] 🎯 User email:', user.email);
          
          // Buscar funis atribuídos via user_funnels (SEM can_view - não existe na tabela)
          console.log('[useDataFilters] 📋 Executando query user_funnels...');
          const { data: userFunnels, error: funnelsError } = await supabase
            .from('user_funnels')
            .select(`
              funnel_id,
              funnel:funnels(id, name)
            `)
            .eq('profile_id', user.id);

          if (funnelsError) {
            console.error('[useDataFilters] ❌ Erro ao buscar user_funnels:', funnelsError);
          }

          console.log('[useDataFilters] 📊 user_funnels encontrados:', userFunnels);

          // Buscar instâncias WhatsApp atribuídas via user_whatsapp_numbers (SEM can_view - não existe na tabela)
          console.log('[useDataFilters] 📋 Executando query user_whatsapp_numbers...');
          const { data: userWhatsapp, error: whatsappError } = await supabase
            .from('user_whatsapp_numbers')
            .select(`
              whatsapp_number_id,
              whatsapp_instance:whatsapp_instances(id, instance_name)
            `)
            .eq('profile_id', user.id);

          if (whatsappError) {
            console.error('[useDataFilters] ❌ Erro ao buscar user_whatsapp_numbers:', whatsappError);
          }

          console.log('[useDataFilters] 📱 user_whatsapp_numbers encontrados:', userWhatsapp);

          // Extrair IDs dos funis e instâncias
          const funnelIds = userFunnels?.map(uf => uf.funnel_id).filter(Boolean) || [];
          const whatsappIds = userWhatsapp?.map(uw => uw.whatsapp_number_id).filter(Boolean) || [];

          console.log('[useDataFilters] 🔍 IDs extraídos:', {
            funnelIds,
            whatsappIds,
            totalFunnels: funnelIds.length,
            totalWhatsapp: whatsappIds.length
          });

          // 🚨 DEBUG CRÍTICO: Verificar se arrays estão vazios
          if (funnelIds.length === 0) {
            console.warn('[useDataFilters] ⚠️ NENHUM FUNIL ENCONTRADO para user.id:', user.id);
            console.warn('[useDataFilters] ⚠️ userFunnels raw:', userFunnels);
          }
          
          if (whatsappIds.length === 0) {
            console.warn('[useDataFilters] ⚠️ NENHUM WHATSAPP ENCONTRADO para user.id:', user.id);
            console.warn('[useDataFilters] ⚠️ userWhatsapp raw:', userWhatsapp);
          }

          const operationalFilters = {
            leadsFilter: { owner_id: user.id }, // Leads atribuídos diretamente
            funnelsFilter: funnelIds.length > 0 ? { id: { in: funnelIds } } : { id: 'no-access' },
            whatsappFilter: whatsappIds.length > 0 ? { id: { in: whatsappIds } } : { id: 'no-access' },
            messagesFilter: { 'leads.owner_id': user.id },
            role: 'operational' as const,
            loading: false
          };

          console.log('[useDataFilters] 🎯 Filtros OPERACIONAL configurados:', operationalFilters);
          
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