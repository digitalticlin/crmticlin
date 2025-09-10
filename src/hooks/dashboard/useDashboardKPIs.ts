
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useDataFilters } from "@/hooks/useDataFilters";

interface KPIData {
  novos_leads: number;
  total_leads: number;
  taxa_conversao: number;
  taxa_perda: number;
  valor_pipeline: number;
  ticket_medio: number;
  tempo_resposta: number;
}

export function useDashboardKPIs(periodFilter: string) {
  const { user } = useAuth();
  const { userFunnels, canViewAllFunnels, isLoading: accessLoading } = useAccessControl();
  const dataFilters = useDataFilters();

  return useQuery({
    queryKey: ['dashboard-kpis', user?.id, periodFilter, userFunnels, canViewAllFunnels, dataFilters.role],
    queryFn: async (): Promise<KPIData> => {
      console.log('[useDashboardKPIs] 🔍 Iniciando consulta KPIs com filtros por role:', {
        userId: user?.id,
        periodFilter,
        userFunnels,
        canViewAllFunnels,
        accessLoading,
        dataFiltersRole: dataFilters.role,
        dataFiltersLoading: dataFilters.loading
      });
      if (!user?.id || dataFilters.loading || !dataFilters.role) {
        return {
          novos_leads: 0,
          total_leads: 0,
          taxa_conversao: 0,
          taxa_perda: 0,
          valor_pipeline: 0,
          ticket_medio: 0,
          tempo_resposta: 0,
        };
      }

      const days = parseInt(periodFilter);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      try {
        // 🚀 CORREÇÃO: Usar mesma lógica do funil de vendas
        console.log('[useDashboardKPIs] 🔧 Aplicando filtros baseados no role:', dataFilters.role);
        
        // Determinar funis que o usuário pode acessar baseado no role
        let accessibleFunnels: string[] = [];
        let userAdminId: string = user.id; // Para operacional, será substituído pelo admin
        
        if (dataFilters.role === 'admin') {
          // Admin: buscar funis criados por ele
          console.log('[useDashboardKPIs] 👑 ADMIN - Buscando funis criados pelo admin');
          const { data: allFunnels, error: funnelsError } = await supabase
            .from('funnels')
            .select('id, name, created_by_user_id')
            .eq('created_by_user_id', user.id);
          
          if (funnelsError) {
            console.error('[useDashboardKPIs] ❌ Erro ao buscar funis admin:', funnelsError);
            throw funnelsError;
          }
          accessibleFunnels = (allFunnels || []).map(f => f.id);
          userAdminId = user.id;
          
        } else if (dataFilters.role === 'operational') {
          // Operacional: usar funis atribuídos via useAccessControl
          console.log('[useDashboardKPIs] 🎯 OPERACIONAL - Usando funis atribuídos:', userFunnels);
          accessibleFunnels = userFunnels;
          
          // Buscar created_by_user_id do perfil operacional (admin que criou)
          const { data: profile } = await supabase
            .from('profiles')
            .select('created_by_user_id')
            .eq('id', user.id)
            .single();
          
          if (profile?.created_by_user_id) {
            userAdminId = profile.created_by_user_id;
            console.log('[useDashboardKPIs] 🎯 Admin do operacional:', userAdminId);
          }
        }

        // Se não tem acesso a nenhum funil, retornar zeros
        if (accessibleFunnels.length === 0) {
          return {
            novos_leads: 0,
            total_leads: 0,
            taxa_conversao: 0,
            taxa_perda: 0,
            valor_pipeline: 0,
            ticket_medio: 0,
            tempo_resposta: 0,
          };
        }

        // Estágios ativos (não ganho, não perdido) dos funis acessíveis
        const { data: activeStages, error: stagesError } = await supabase
          .from('kanban_stages')
          .select('id, is_won, is_lost, funnel_id, title')
          .in('funnel_id', accessibleFunnels)
          .eq('is_won', false)
          .eq('is_lost', false);

        if (stagesError) throw stagesError;
        const activeStageIds = (activeStages || []).map(s => s.id);


        // 🚀 CORREÇÃO: Aplicar mesmos filtros do funil de vendas para leads
        let totalLeadsCount = 0;
        if (activeStageIds.length > 0) {
          let countQuery = supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .in('funnel_id', accessibleFunnels)
            .in('kanban_stage_id', activeStageIds);

          // Aplicar filtros específicos por role
          if (dataFilters.role === 'admin') {
            countQuery = countQuery.eq('created_by_user_id', userAdminId);
            console.log('[useDashboardKPIs] 👑 Contagem ADMIN - filtro por created_by_user_id:', userAdminId);
          } else if (dataFilters.role === 'operational') {
            // Operacional: filtrar por instâncias WhatsApp atribuídas
            console.log('[useDashboardKPIs] 🎯 Contagem OPERACIONAL - buscando instâncias atribuídas');
            const { data: userWhatsAppNumbers } = await supabase
              .from('user_whatsapp_numbers')
              .select('whatsapp_number_id')
              .eq('profile_id', user.id);

            if (!userWhatsAppNumbers || userWhatsAppNumbers.length === 0) {
              console.log('[useDashboardKPIs] ⚠️ Operacional sem instâncias atribuídas');
              totalLeadsCount = 0;
            } else {
              const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
              console.log('[useDashboardKPIs] 🎯 Instâncias acessíveis:', whatsappIds);
              
              countQuery = countQuery
                .in('whatsapp_number_id', whatsappIds)
                .eq('created_by_user_id', userAdminId);
              
              const { count, error: totalCountError } = await countQuery;
              if (totalCountError) {
                console.error('[useDashboardKPIs] ❌ Erro na contagem operacional:', totalCountError);
                throw totalCountError;
              }
              totalLeadsCount = count || 0;
            }
          }

          // Se for admin, executar a query
          if (dataFilters.role === 'admin') {
            const { count, error: totalCountError } = await countQuery;
            if (totalCountError) {
              console.error('[useDashboardKPIs] ❌ Erro na contagem admin:', totalCountError);
              throw totalCountError;
            }
            totalLeadsCount = count || 0;
          }
        }

        // 🚀 CORREÇÃO: Novos leads com mesmos filtros por role
        let newLeadsQuery = supabase
          .from('leads')
          .select('id')
          .in('funnel_id', accessibleFunnels)
          .gte('created_at', startDate.toISOString());

        // Aplicar filtros específicos por role
        let newLeadsData: any[] = [];
        if (dataFilters.role === 'admin') {
          newLeadsQuery = newLeadsQuery.eq('created_by_user_id', userAdminId);
          const { data, error: newLeadsError } = await newLeadsQuery;
          if (newLeadsError) throw newLeadsError;
          newLeadsData = data || [];
          console.log('[useDashboardKPIs] 👑 Novos leads ADMIN:', newLeadsData.length);
        } else if (dataFilters.role === 'operational') {
          // Operacional: mesmos filtros por instância
          const { data: userWhatsAppNumbers } = await supabase
            .from('user_whatsapp_numbers')
            .select('whatsapp_number_id')
            .eq('profile_id', user.id);

          if (userWhatsAppNumbers && userWhatsAppNumbers.length > 0) {
            const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
            newLeadsQuery = newLeadsQuery
              .in('whatsapp_number_id', whatsappIds)
              .eq('created_by_user_id', userAdminId);
            
            const { data, error: newLeadsError } = await newLeadsQuery;
            if (newLeadsError) throw newLeadsError;
            newLeadsData = data || [];
            console.log('[useDashboardKPIs] 🎯 Novos leads OPERACIONAL:', newLeadsData.length);
          }
        }

        // 🚀 CORREÇÃO: Deals com mesmos filtros por role
        let dealsQuery = supabase
          .from('deals')
          .select(`
            status, 
            value, 
            date,
            leads!inner(funnel_id, created_by_user_id, whatsapp_number_id)
          `)
          .in('leads.funnel_id', accessibleFunnels)
          .gte('date', startDate.toISOString());

        // Aplicar filtros específicos por role
        let dealsData: any[] = [];
        if (dataFilters.role === 'admin') {
          dealsQuery = dealsQuery.eq('leads.created_by_user_id', userAdminId);
          const { data, error: dealsError } = await dealsQuery;
          if (dealsError) throw dealsError;
          dealsData = data || [];
          console.log('[useDashboardKPIs] 👑 Deals ADMIN:', dealsData.length);
        } else if (dataFilters.role === 'operational') {
          // Operacional: filtrar por instâncias WhatsApp
          const { data: userWhatsAppNumbers } = await supabase
            .from('user_whatsapp_numbers')
            .select('whatsapp_number_id')
            .eq('profile_id', user.id);

          if (userWhatsAppNumbers && userWhatsAppNumbers.length > 0) {
            const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
            dealsQuery = dealsQuery
              .in('leads.whatsapp_number_id', whatsappIds)
              .eq('leads.created_by_user_id', userAdminId);
            
            const { data, error: dealsError } = await dealsQuery;
            if (dealsError) throw dealsError;
            dealsData = data || [];
            console.log('[useDashboardKPIs] 🎯 Deals OPERACIONAL:', dealsData.length);
          }
        }

        const totalLeads = totalLeadsCount || 0;
        const novosLeads = newLeadsData?.length || 0;
        const wonDeals = dealsData?.filter(d => d.status === 'won').length || 0;
        const lostDeals = dealsData?.filter(d => d.status === 'lost').length || 0;
        const totalDeals = wonDeals + lostDeals;

        const taxaConversao = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;
        const taxaPerda = totalDeals > 0 ? Math.round((lostDeals / totalDeals) * 100) : 0;

        // 🚀 CORREÇÃO: Valor do pipeline com mesmos filtros por role
        let valorPipeline = 0;
        if (activeStageIds.length > 0) {
          const PAGE_SIZE = 1000;
          for (let offset = 0; ; offset += PAGE_SIZE) {
            let pipelineQuery = supabase
              .from('leads')
              .select('purchase_value')
              .in('funnel_id', accessibleFunnels)
              .in('kanban_stage_id', activeStageIds)
              .range(offset, offset + PAGE_SIZE - 1);

            // Aplicar filtros por role
            if (dataFilters.role === 'admin') {
              pipelineQuery = pipelineQuery.eq('created_by_user_id', userAdminId);
            } else if (dataFilters.role === 'operational') {
              // Usar as mesmas instâncias WhatsApp já consultadas
              const { data: userWhatsAppNumbers } = await supabase
                .from('user_whatsapp_numbers')
                .select('whatsapp_number_id')
                .eq('profile_id', user.id);

              if (userWhatsAppNumbers && userWhatsAppNumbers.length > 0) {
                const whatsappIds = userWhatsAppNumbers.map(uwn => uwn.whatsapp_number_id);
                pipelineQuery = pipelineQuery
                  .in('whatsapp_number_id', whatsappIds)
                  .eq('created_by_user_id', userAdminId);
              } else {
                // Se não tem instâncias, valor é zero
                break;
              }
            }

            const { data: pageData, error: pageError } = await pipelineQuery;
            if (pageError) throw pageError;
            
            const current = (pageData || []).reduce((sum, lead: any) => sum + (Number(lead.purchase_value) || 0), 0);
            valorPipeline += current;
            
            if (!pageData || pageData.length < PAGE_SIZE) break;
          }
        }

        const ticketMedio = wonDeals > 0 ? 
          (dealsData?.filter(d => d.status === 'won').reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 0) / wonDeals : 0;

        return {
          novos_leads: novosLeads,
          total_leads: totalLeads,
          taxa_conversao: taxaConversao,
          taxa_perda: taxaPerda,
          valor_pipeline: valorPipeline,
          ticket_medio: ticketMedio,
          tempo_resposta: 45,
        };
      } catch (error) {
        console.error('Erro ao buscar KPIs:', error);
        return {
          novos_leads: 0,
          total_leads: 0,
          taxa_conversao: 0,
          taxa_perda: 0,
          valor_pipeline: 0,
          ticket_medio: 0,
          tempo_resposta: 0,
        };
      }
    },
    enabled: !!user?.id && !accessLoading && !dataFilters.loading && !!dataFilters.role,
    initialData: {
      novos_leads: 0,
      total_leads: 0,
      taxa_conversao: 0,
      taxa_perda: 0,
      valor_pipeline: 0,
      ticket_medio: 0,
      tempo_resposta: 0,
    },
  });
}
