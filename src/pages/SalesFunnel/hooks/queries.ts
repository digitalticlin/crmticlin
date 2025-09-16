/**
 * 🔒 QUERIES ISOLADAS - PÁGINA SALESFUNNEL
 * Todas as queries com proteção multi-tenant OBRIGATÓRIA
 * CRÍTICO: Corrige vazamentos do sistema atual
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useSalesFunnelPageFilters,
  buildSecureLeadsQuery,
  buildSecureStagesQuery,
  validateLeadAccess,
  validateStageAccess
} from "./datafilters";
import { supabase } from "@/integrations/supabase/client";

/**
 * 🔒 QUERY PRINCIPAL - Leads do funil com proteção multi-tenant
 */
export const useSalesFunnelLeads = () => {
  const filters = useSalesFunnelPageFilters();
  
  return useQuery({
    queryKey: [
      "salesfunnel-leads", 
      filters.userId, 
      filters.role, 
      filters.createdByUserId,
      filters.selectedFunnelId,
      filters.searchQuery,
      filters.sortBy,
      filters.sortOrder
    ],
    queryFn: async () => {
      if (!filters.userId || !filters.role || filters.loading) {
        console.log('[SalesFunnel Leads] ⚠️ Bloqueado: usuário não autenticado');
        return [];
      }
      
      console.log('[SalesFunnel Leads] 🔒 Buscando leads com proteção multi-tenant:', {
        role: filters.role,
        createdByUserId: filters.createdByUserId,
        ownerFilter: filters.ownerFilter,
        instancesCount: filters.whatsappInstancesFilter?.length || 0
      });
      
      // 🔒 Query segura com todos os filtros
      const query = buildSecureLeadsQuery(filters);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[SalesFunnel Leads] Erro:', error);
        throw error;
      }
      
      // 🔒 VALIDAÇÃO ADICIONAL (dupla verificação)
      const validLeads = (data || []).filter(lead => 
        validateLeadAccess(lead, filters)
      );
      
      console.log('[SalesFunnel Leads] ✅ Leads carregados com segurança:', {
        total: validLeads.length,
        filtered: (data?.length || 0) - validLeads.length
      });
      
      return validLeads;
    },
    enabled: !!filters.userId && !filters.loading && !!filters.role,
    staleTime: 1000 * 60 * 2, // 2 minutos
    refetchInterval: filters.enableAutoRefresh ? filters.refreshInterval * 1000 : false
  });
};

/**
 * 🔒 QUERY ESTÁGIOS - Kanban stages com isolamento
 */
export const useSalesFunnelStages = () => {
  const filters = useSalesFunnelPageFilters();
  
  return useQuery({
    queryKey: [
      "salesfunnel-stages",
      filters.userId,
      filters.role,
      filters.createdByUserId,
      filters.selectedFunnelId
    ],
    queryFn: async () => {
      if (!filters.userId || !filters.role || filters.loading) {
        console.log('[SalesFunnel Stages] ⚠️ Bloqueado: usuário não autenticado');
        return [];
      }
      
      console.log('[SalesFunnel Stages] 🔒 Buscando estágios com proteção multi-tenant');
      
      // 🔒 Query segura para estágios
      const query = buildSecureStagesQuery(filters);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[SalesFunnel Stages] Erro:', error);
        throw error;
      }
      
      // 🔒 VALIDAÇÃO ADICIONAL
      const validStages = (data || []).filter(stage => 
        validateStageAccess(stage, filters)
      );
      
      console.log('[SalesFunnel Stages] ✅ Estágios carregados:', validStages.length);
      
      return validStages;
    },
    enabled: !!filters.userId && !filters.loading && !!filters.role,
    staleTime: 1000 * 60 * 10, // 10 minutos (estágios mudam pouco)
  });
};

/**
 * 🔒 QUERY FUNIS DISPONÍVEIS - Com proteção multi-tenant
 */
export const useSalesFunnelAvailableFunnels = () => {
  const filters = useSalesFunnelPageFilters();
  
  return useQuery({
    queryKey: [
      "salesfunnel-available-funnels",
      filters.userId,
      filters.role,
      filters.createdByUserId
    ],
    queryFn: async () => {
      if (!filters.userId || !filters.role || filters.loading) return [];
      
      let query = supabase
        .from('funnels')
        .select('id, name, description, color')
        .order('name');
      
      // 🔒 APLICAR FILTRO MULTI-TENANT
      if (filters.role === 'admin' && filters.createdByUserId) {
        query = query.eq('created_by_user_id', filters.createdByUserId);
        console.log('[Available Funnels] 👑 Admin filter aplicado');
        
      } else if (filters.role === 'operational' && filters.assignedFunnelsFilter) {
        if (filters.assignedFunnelsFilter.length > 0) {
          query = query.in('id', filters.assignedFunnelsFilter);
          console.log('[Available Funnels] 🎯 Filtros operacionais aplicados');
        } else {
          return []; // Operacional sem funis atribuídos
        }
      } else {
        return []; // Sem permissão
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[Available Funnels] Erro:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!filters.userId && !filters.loading && !!filters.role,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
};

/**
 * 🔒 QUERY TAGS DISPONÍVEIS - Com isolamento
 */
export const useSalesFunnelAvailableTags = () => {
  const filters = useSalesFunnelPageFilters();
  
  return useQuery({
    queryKey: [
      "salesfunnel-available-tags",
      filters.userId,
      filters.role,
      filters.createdByUserId
    ],
    queryFn: async () => {
      if (!filters.userId || !filters.role || filters.loading) return [];
      
      let query = supabase
        .from('tags')
        .select('id, name, color')
        .order('name');
      
      // 🔒 APLICAR FILTRO MULTI-TENANT
      if (filters.role === 'admin' && filters.createdByUserId) {
        query = query.eq('created_by_user_id', filters.createdByUserId);
      } else if (filters.role === 'operational') {
        // Operacional pode ver tags dos funis atribuídos
        // TODO: Implementar relacionamento tag -> funnel
        return []; // Por enquanto, operacional não vê tags
      } else {
        return [];
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[Available Tags] Erro:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!filters.userId && !filters.loading && !!filters.role,
    staleTime: 1000 * 60 * 20, // 20 minutos
  });
};

/**
 * 🔒 MUTATION - Mover lead entre estágios com validação
 */
export const useMoveLead = () => {
  const filters = useSalesFunnelPageFilters();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      leadId, 
      newStageId, 
      oldStageId 
    }: { 
      leadId: string; 
      newStageId: string; 
      oldStageId: string;
    }) => {
      if (!filters.userId || !filters.role) {
        throw new Error("Usuário não autenticado");
      }
      
      console.log('[Move Lead] 🔒 Movendo lead com validação:', {
        leadId,
        from: oldStageId,
        to: newStageId,
        role: filters.role
      });
      
      // 1. Verificar se tem acesso ao lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (leadError || !leadData) {
        throw new Error("Lead não encontrado");
      }
      
      // 🔒 VALIDAR ACESSO AO LEAD
      if (!validateLeadAccess(leadData, filters)) {
        throw new Error("Acesso negado ao lead");
      }
      
      // 2. Verificar se tem acesso ao estágio de destino
      const { data: stageData, error: stageError } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('id', newStageId)
        .single();
      
      if (stageError || !stageData) {
        throw new Error("Estágio não encontrado");
      }
      
      // 🔒 VALIDAR ACESSO AO ESTÁGIO
      if (!validateStageAccess(stageData, filters)) {
        throw new Error("Acesso negado ao estágio");
      }
      
      // 3. Executar a movimentação
      const { data: updatedLead, error: updateError } = await supabase
        .from('leads')
        .update({ 
          kanban_stage_id: newStageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      console.log('[Move Lead] ✅ Lead movido com segurança:', leadId);
      
      return updatedLead;
    },
    onSuccess: () => {
      // Invalidar cache dos leads
      queryClient.invalidateQueries({ 
        queryKey: ["salesfunnel-leads"] 
      });
    }
  });
};

/**
 * 🔒 MUTATION - Criar novo lead com multi-tenant
 */
export const useCreateLead = () => {
  const filters = useSalesFunnelPageFilters();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadData: any) => {
      if (!filters.userId || !filters.createdByUserId || filters.role !== 'admin') {
        throw new Error("Apenas administradores podem criar leads");
      }
      
      // 🔒 FORÇAR created_by_user_id
      const secureLeadData = {
        ...leadData,
        created_by_user_id: filters.createdByUserId,
        owner_id: leadData.owner_id || filters.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('leads')
        .insert(secureLeadData)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('[Create Lead] ✅ Lead criado com proteção multi-tenant:', data.id);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["salesfunnel-leads"] 
      });
    }
  });
};

/**
 * 🔒 MUTATION - Atualizar lead com validação
 */
export const useUpdateLead = () => {
  const filters = useSalesFunnelPageFilters();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      leadId, 
      updates 
    }: { 
      leadId: string; 
      updates: any; 
    }) => {
      if (!filters.userId || !filters.role) {
        throw new Error("Usuário não autenticado");
      }
      
      // Verificar acesso ao lead primeiro
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (!existingLead || !validateLeadAccess(existingLead, filters)) {
        throw new Error("Acesso negado ao lead");
      }
      
      // 🔒 NUNCA permitir alterar created_by_user_id
      const { created_by_user_id, ...safeUpdates } = updates;
      
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...safeUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('[Update Lead] ✅ Lead atualizado com segurança:', leadId);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["salesfunnel-leads"] 
      });
    }
  });
};

/**
 * 🔒 MUTATION - Deletar lead com validação
 */
export const useDeleteLead = () => {
  const filters = useSalesFunnelPageFilters();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      if (!filters.userId || !filters.role) {
        throw new Error("Usuário não autenticado");
      }
      
      // Verificar acesso antes de deletar
      const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (!existingLead || !validateLeadAccess(existingLead, filters)) {
        throw new Error("Acesso negado ao lead");
      }
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
      
      if (error) throw error;
      
      console.log('[Delete Lead] ✅ Lead deletado com segurança:', leadId);
      
      return leadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["salesfunnel-leads"] 
      });
    }
  });
};

/**
 * 🔒 MUTATION - Operações em lote com validação
 */
export const useBulkOperations = () => {
  const filters = useSalesFunnelPageFilters();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      operation, 
      leadIds, 
      data 
    }: { 
      operation: 'move' | 'delete' | 'update' | 'tag';
      leadIds: string[];
      data?: any;
    }) => {
      if (!filters.userId || !filters.role) {
        throw new Error("Usuário não autenticado");
      }
      
      console.log('[Bulk Operations] 🔒 Operação em lote:', {
        operation,
        count: leadIds.length,
        role: filters.role
      });
      
      // 1. Verificar acesso a todos os leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .in('id', leadIds);
      
      // 🔒 VALIDAR ACESSO A TODOS OS LEADS
      const accessibleLeads = (leadsData || []).filter(lead => 
        validateLeadAccess(lead, filters)
      );
      
      if (accessibleLeads.length !== leadIds.length) {
        throw new Error(`Acesso negado a ${leadIds.length - accessibleLeads.length} leads`);
      }
      
      // 2. Executar operação baseada no tipo
      let result;
      
      switch (operation) {
        case 'move':
          if (!data?.stageId) throw new Error("stageId é obrigatório para move");
          
          result = await supabase
            .from('leads')
            .update({ 
              kanban_stage_id: data.stageId,
              updated_at: new Date().toISOString()
            })
            .in('id', leadIds)
            .select();
          break;
          
        case 'delete':
          result = await supabase
            .from('leads')
            .delete()
            .in('id', leadIds);
          break;
          
        case 'update':
          if (!data?.updates) throw new Error("updates é obrigatório para update");
          
          const { created_by_user_id, ...safeUpdates } = data.updates;
          
          result = await supabase
            .from('leads')
            .update({
              ...safeUpdates,
              updated_at: new Date().toISOString()
            })
            .in('id', leadIds)
            .select();
          break;
          
        default:
          throw new Error(`Operação não suportada: ${operation}`);
      }
      
      if (result.error) throw result.error;
      
      console.log('[Bulk Operations] ✅ Operação concluída:', {
        operation,
        processed: accessibleLeads.length
      });
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["salesfunnel-leads"] 
      });
    }
  });
};