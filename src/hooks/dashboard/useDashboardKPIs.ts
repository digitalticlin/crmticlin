
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "@/hooks/useAccessControl";

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

  return useQuery({
    queryKey: ['dashboard-kpis', user?.id, periodFilter, userFunnels, canViewAllFunnels],
    queryFn: async (): Promise<KPIData> => {
      console.log('[useDashboardKPIs] 🔍 Iniciando consulta KPIs:', {
        userId: user?.id,
        periodFilter,
        userFunnels,
        canViewAllFunnels,
        accessLoading
      });
      if (!user?.id) {
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
        // 🚀 CORREÇÃO MULTITENANT: Buscar profile primeiro
        console.log('[useDashboardKPIs] 🔧 Aplicando filtro multitenant manual');
        
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single();

        if (profileError || !userProfile) {
          console.error('[useDashboardKPIs] ❌ Profile não encontrado:', profileError);
          throw new Error('Perfil do usuário não encontrado');
        }

        console.log('[useDashboardKPIs] 🔒 Filtro multitenant aplicado para profile:', userProfile.id);

        // DIAGNÓSTICO COMPLETO
        console.log('[useDashboardKPIs] 🚀 === INÍCIO DIAGNÓSTICO COMPLETO ===');
        console.log('[useDashboardKPIs] 👤 Dados do usuário:', {
          userId: user?.id,
          periodFilter,
          days: parseInt(periodFilter),
          startDate: startDate.toISOString()
        });
        console.log('[useDashboardKPIs] 🔐 Controle de acesso:', {
          canViewAllFunnels,
          userFunnelsLength: userFunnels.length,
          userFunnels,
          accessLoading
        });

        // Determinar funis que o usuário pode acessar
        let accessibleFunnels: string[] = [];
        
        if (canViewAllFunnels) {
          // Admin: buscar TODOS os funis da organização (sem filtro de created_by_user_id)
          const { data: allFunnels, error: funnelsError } = await supabase
            .from('funnels')
            .select('id');
          
          if (funnelsError) {
            console.error('[useDashboardKPIs] ❌ Erro ao buscar todos os funis:', funnelsError);
            throw funnelsError;
          }
          accessibleFunnels = (allFunnels || []).map(f => f.id);
          console.log('[useDashboardKPIs] ✅ Todos os funis encontrados (admin):', accessibleFunnels.length);
        } else {
          // Operacional: usar apenas funis atribuídos
          accessibleFunnels = userFunnels;
          console.log('[useDashboardKPIs] ✅ Usuário operacional - funis atribuídos:', accessibleFunnels.length);
        }

        // Se não tem acesso a nenhum funil, retornar zeros
        if (accessibleFunnels.length === 0) {
          console.log('[useDashboardKPIs] ⚠️ === NENHUM FUNIL ACESSÍVEL ===');
          console.log('[useDashboardKPIs] ❌ Verificar se funis existem no banco!');
          console.log('[useDashboardKPIs] ❌ Verificar se RLS está permitindo acesso!');
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

        // Estágios ativos (não ganho, não perdido)
        const { data: activeStages, error: stagesError } = await supabase
          .from('kanban_stages')
          .select('id, is_won, is_lost')
          .eq('is_won', false)
          .eq('is_lost', false);

        if (stagesError) throw stagesError;
        const activeStageIds = (activeStages || []).map(s => s.id);

        console.log('[useDashboardKPIs] 📊 Consultando leads com:', {
          accessibleFunnels,
          activeStageIds: activeStageIds.length,
          startDate: startDate.toISOString()
        });

        // Contagem total de leads (COM FILTRO MULTITENANT)
        const { count: totalLeadsCount, error: totalCountError } = await supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('created_by_user_id', userProfile.id)  // 🔒 FILTRO MULTITENANT
          .in('funnel_id', accessibleFunnels)
          .in('kanban_stage_id', activeStageIds);

        if (totalCountError) {
          console.error('[useDashboardKPIs] ❌ Erro na contagem total:', totalCountError);
          throw totalCountError;
        }
        console.log('[useDashboardKPIs] ✅ Total leads encontrados:', totalLeadsCount);

        // Novos leads no período (COM FILTRO MULTITENANT)
        const { data: newLeads, error: newLeadsError } = await supabase
          .from('leads')
          .select('id')
          .eq('created_by_user_id', userProfile.id)  // 🔒 FILTRO MULTITENANT
          .in('funnel_id', accessibleFunnels)
          .gte('created_at', startDate.toISOString());

        if (newLeadsError) throw newLeadsError;

        // Deals no período (JOIN com leads para acessar funnel_id)
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select(`
            status, 
            value, 
            date,
            leads!inner(funnel_id)
          `)
          .in('leads.funnel_id', accessibleFunnels)
          .gte('date', startDate.toISOString());

        if (dealsError) {
          console.error('[useDashboardKPIs] ❌ Erro ao buscar deals:', dealsError);
          throw dealsError;
        }
        console.log('[useDashboardKPIs] ✅ Deals encontrados:', deals?.length || 0);

        const totalLeads = totalLeadsCount || 0;
        const novosLeads = newLeads?.length || 0;
        const wonDeals = deals?.filter(d => d.status === 'won').length || 0;
        const lostDeals = deals?.filter(d => d.status === 'lost').length || 0;
        const totalDeals = wonDeals + lostDeals;

        const taxaConversao = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;
        const taxaPerda = totalDeals > 0 ? Math.round((lostDeals / totalDeals) * 100) : 0;

        console.log('[useDashboardKPIs] 📈 === RESULTADOS CALCULADOS ===');
        console.log('[useDashboardKPIs] 📊 Dados brutos:', {
          totalLeads,
          novosLeads,
          wonDeals,
          lostDeals,
          totalDeals,
          newLeadsData: newLeads?.length,
          dealsData: deals?.length
        });

        // Somatório de purchase_value de forma paginada para evitar limite de 1000 (filtrada por funis acessíveis)
        let valorPipeline = 0;
        const PAGE_SIZE = 1000;
        for (let offset = 0; ; offset += PAGE_SIZE) {
          const { data: pageData, error: pageError } = await supabase
            .from('leads')
            .select('purchase_value')
            .eq('created_by_user_id', userProfile.id)  // 🔒 FILTRO MULTITENANT
            .in('funnel_id', accessibleFunnels)
            .in('kanban_stage_id', activeStageIds)
            .range(offset, offset + PAGE_SIZE - 1);

          if (pageError) throw pageError;
          const current = (pageData || []).reduce((sum, lead: any) => sum + (Number(lead.purchase_value) || 0), 0);
          valorPipeline += current;
          if (!pageData || pageData.length < PAGE_SIZE) break;
        }
        const ticketMedio = wonDeals > 0 ? 
          (deals?.filter(d => d.status === 'won').reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 0) / wonDeals : 0;

        const finalResult = {
          novos_leads: novosLeads,
          total_leads: totalLeads,
          taxa_conversao: taxaConversao,
          taxa_perda: taxaPerda,
          valor_pipeline: valorPipeline,
          ticket_medio: ticketMedio,
          tempo_resposta: 45, // Valor fixo por enquanto
        };

        console.log('[useDashboardKPIs] 🎯 === RESULTADO FINAL ===');
        console.log('[useDashboardKPIs] ✅ KPIs calculados:', finalResult);
        console.log('[useDashboardKPIs] 🏁 === FIM DIAGNÓSTICO ===');

        return finalResult;
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
    enabled: !!user?.id && !accessLoading,
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
