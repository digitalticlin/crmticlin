import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KanbanColumn, KanbanLead, KanbanTag } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";
import { toast } from "sonner";

interface FunnelData {
  id: string;
  name: string;
  description?: string;
  created_by_user_id: string;
  created_at?: string;
}

interface LeadData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  document_id?: string;
  kanban_stage_id: string;
  notes?: string;
  purchase_value?: number;
  owner_id?: string;
  last_message?: string;
  last_message_time?: string;
  created_at: string;
  updated_at?: string;
  funnel_id?: string;
  created_by_user_id?: string;
  lastMessage: string;
  lastMessageTime: string;
  tags: KanbanTag[];
  columnId?: string;
  purchaseValue?: number;
  assignedUser?: string;
  unread_count?: number;
}

export function useSalesFunnelDirect() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [funnels, setFunnels] = useState<FunnelData[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelData | null>(null);
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);

  // CORREÇÃO: Refs para controlar execução e evitar loops
  const fetchingRef = useRef({
    funnels: false,
    stages: false,
    leads: false
  });
  
  const lastFetchedRef = useRef({
    funnelId: '',
    stagesCount: 0
  });

  console.log('[useSalesFunnelDirect] 🚀 Hook estado:', {
    userId: user?.id,
    loading,
    funnelsCount: funnels.length,
    selectedFunnelId: selectedFunnel?.id,
    stagesCount: stages.length,
    leadsCount: leads.length
  });

  // CORREÇÃO: Validação otimizada e memoizada
  const validateData = useMemo(() => {
    return (type: string, data: any) => {
      try {
        if (!data) {
          console.warn(`[useSalesFunnelDirect] ⚠️ ${type}: dados nulos/undefined`);
          return false;
        }
        if (!Array.isArray(data)) {
          console.warn(`[useSalesFunnelDirect] ⚠️ ${type}: não é array`, typeof data);
          return false;
        }
        console.log(`[useSalesFunnelDirect] ✅ ${type}: dados válidos (${data.length} items)`);
        return true;
      } catch (err) {
        console.error(`[useSalesFunnelDirect] ❌ Erro na validação de ${type}:`, err);
        return false;
      }
    };
  }, []);

  // CORREÇÃO: Função isolada para atribuir stage, sem dependências circulares
  const ensureLeadHasStage = useCallback(async (leadId: string, funnelId: string) => {
    if (!user?.id) return;

    try {
      const { data: firstStage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('funnel_id', funnelId)
        .order('order_position')
        .limit(1)
        .single();

      if (firstStage) {
        console.log(`[useSalesFunnelDirect] 🔧 Atribuindo primeira etapa ${firstStage.id} ao lead ${leadId}`);
        
        const { error: updateError } = await supabase
          .from('leads')
          .update({ kanban_stage_id: firstStage.id })
          .eq('id', leadId);

        if (updateError) {
          console.error(`[useSalesFunnelDirect] ❌ Erro ao atualizar lead ${leadId}:`, updateError);
        } else {
          console.log(`[useSalesFunnelDirect] ✅ Lead ${leadId} atualizado com sucesso`);
        }
      }
    } catch (err) {
      console.error(`[useSalesFunnelDirect] ❌ Erro ao garantir etapa do lead:`, err);
    }
  }, [user?.id]);

  // CORREÇÃO: fetchFunnels com controle de execução
  const fetchFunnels = useCallback(async () => {
    if (!user?.id || fetchingRef.current.funnels) return;
    
    fetchingRef.current.funnels = true;
    
    try {
      console.log('[useSalesFunnelDirect] 📊 Buscando funis para usuário:', user.id);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('funnels')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('is_active', true);

      if (fetchError) throw fetchError;
      if (!validateData('Funnels', data)) throw new Error('Dados de funis inválidos');

      setFunnels(data || []);
      if (data && data.length > 0 && !selectedFunnel) {
        setSelectedFunnel(data[0]);
      }
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao buscar funis:', err);
      setError(`Erro ao carregar funis: ${err.message}`);
      toast.error('Erro ao carregar funis');
    } finally {
      fetchingRef.current.funnels = false;
    }
  }, [user?.id, selectedFunnel, validateData]);

  // CORREÇÃO: fetchStages com controle de execução
  const fetchStages = useCallback(async () => {
    if (!selectedFunnel?.id || fetchingRef.current.stages) return;
    
    // Evitar fetch desnecessário se já temos os dados
    if (lastFetchedRef.current.funnelId === selectedFunnel.id && stages.length > 0) {
      console.log('[useSalesFunnelDirect] ✅ Stages já carregadas para este funil');
      return;
    }
    
    fetchingRef.current.stages = true;
    
    try {
      console.log('[useSalesFunnelDirect] 📊 Buscando etapas para funil:', selectedFunnel.id);
      
      const { data, error: fetchError } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', selectedFunnel.id)
        .order('order_position');

      if (fetchError) throw fetchError;
      if (!validateData('Stages', data)) throw new Error('Dados de stages inválidos');

      const mappedStages: KanbanStage[] = (data || []).map(stage => ({
        id: stage.id,
        title: stage.title,
        color: stage.color || '#e0e0e0',
        is_fixed: stage.is_fixed || false,
        is_won: stage.is_won || false,
        is_lost: stage.is_lost || false,
        order_position: stage.order_position,
        funnel_id: stage.funnel_id,
        created_by_user_id: stage.created_by_user_id
      }));
      
      setStages(mappedStages);
      lastFetchedRef.current.funnelId = selectedFunnel.id;
      lastFetchedRef.current.stagesCount = mappedStages.length;
      
      console.log('[useSalesFunnelDirect] ✅ Etapas carregadas:', {
        count: mappedStages.length,
        stages: mappedStages.map(s => ({ id: s.id, title: s.title, order: s.order_position }))
      });
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao buscar stages:', err);
      setError(`Erro ao carregar etapas: ${err.message}`);
    } finally {
      fetchingRef.current.stages = false;
    }
  }, [selectedFunnel?.id, validateData, stages.length]);

  // CORREÇÃO: fetchLeads sem dependência de stages, com controle de execução
  const fetchLeads = useCallback(async () => {
    if (!selectedFunnel?.id || fetchingRef.current.leads) return;
    
    fetchingRef.current.leads = true;
    
    try {
      console.log('[useSalesFunnelDirect] 📊 Buscando leads para funil:', selectedFunnel.id);
      
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('funnel_id', selectedFunnel.id);

      if (fetchError) throw fetchError;
      if (!validateData('Leads', data)) throw new Error('Dados de leads inválidos');

      const processedLeads: KanbanLead[] = [];
      const leadsWithoutStage: string[] = [];

      for (const lead of data || []) {
        // Se o lead não tem stage_id, marcar para correção posterior
        if (!lead.kanban_stage_id) {
          console.warn(`[useSalesFunnelDirect] ⚠️ Lead ${lead.id} sem etapa, será corrigido`);
          leadsWithoutStage.push(lead.id);
        }

        const mappedLead: KanbanLead = {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          company: lead.company,
          address: lead.address,
          documentId: lead.document_id,
          columnId: lead.kanban_stage_id || '', // Temporário até correção
          notes: lead.notes,
          purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
          assignedUser: lead.owner_id,
          lastMessage: lead.last_message || '',
          lastMessageTime: lead.last_message_time || lead.created_at || '',
          tags: [],
          created_at: lead.created_at,
          unread_count: lead.unread_count || 0
        };

        processedLeads.push(mappedLead);
      }
      
      setLeads(processedLeads);
      
      console.log('[useSalesFunnelDirect] ✅ Leads processados:', {
        total: processedLeads.length,
        withoutStage: leadsWithoutStage.length
      });
      
      // CORREÇÃO: Corrigir leads sem stage de forma assíncrona, sem bloquear o render
      if (leadsWithoutStage.length > 0) {
        setTimeout(() => {
          leadsWithoutStage.forEach(leadId => {
            ensureLeadHasStage(leadId, selectedFunnel.id);
          });
        }, 100);
      }
      
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao buscar leads:', err);
      setError(`Erro ao carregar leads: ${err.message}`);
    } finally {
      fetchingRef.current.leads = false;
    }
  }, [selectedFunnel?.id, validateData, ensureLeadHasStage]);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchFunnels();
    }
  }, [user?.id]); // Removido fetchFunnels das dependências

  useEffect(() => {
    if (selectedFunnel?.id) {
      fetchStages();
    }
  }, [selectedFunnel?.id]); // Removido fetchStages das dependências

  useEffect(() => {
    if (selectedFunnel?.id && lastFetchedRef.current.stagesCount > 0) {
      fetchLeads();
    }
  }, [selectedFunnel?.id, lastFetchedRef.current.stagesCount]); // Controlado por ref

  useEffect(() => {
    if (funnels.length > 0 || error) {
      setLoading(false);
    }
  }, [funnels.length, error]);

  // CORREÇÃO: Memoização otimizada de columns
  const columns = useMemo((): KanbanColumn[] => {
    try {
      if (!stages.length) {
        console.log('[useSalesFunnelDirect] ⚠️ Nenhuma etapa disponível para criar colunas');
        return [];
      }

      const mainStages = stages.filter(stage => !stage.is_won && !stage.is_lost);
      
      const kanbanColumns: KanbanColumn[] = mainStages.map(stage => {
        const stageLeads = leads.filter(lead => lead.columnId === stage.id);
        
        return {
          id: stage.id,
          title: stage.title,
          leads: stageLeads,
          color: stage.color || "#e0e0e0",
          isFixed: stage.is_fixed,
          isHidden: false
        };
      });

      console.log('[useSalesFunnelDirect] ✅ Colunas criadas:', {
        totalColumns: kanbanColumns.length,
        totalLeads: kanbanColumns.reduce((sum, col) => sum + col.leads.length, 0)
      });

      return kanbanColumns;
    } catch (err) {
      console.error('[useSalesFunnelDirect] ❌ Erro na transformação de colunas:', err);
      setError(`Erro na transformação de dados: ${err}`);
      return [];
    }
  }, [stages, leads]); // Dependências mínimas e estáveis

  // CORREÇÃO: setColumns otimizado
  const setColumns = useCallback((newColumns: KanbanColumn[]) => {
    console.log('[useSalesFunnelDirect] 🔄 Atualizando colunas localmente:', newColumns.length);
    
    try {
      const allLeads: KanbanLead[] = [];
      newColumns.forEach(column => {
        column.leads.forEach(lead => {
          allLeads.push({
            ...lead,
            columnId: column.id
          });
        });
      });
      
      setLeads(allLeads);
      
      console.log('[useSalesFunnelDirect] ✅ Estado local atualizado:', {
        totalLeads: allLeads.length
      });
      
    } catch (err) {
      console.error('[useSalesFunnelDirect] ❌ Erro em setColumns:', err);
    }
  }, []);

  const wonStageId = useMemo(() => {
    const wonStage = stages.find(stage => stage.is_won);
    return wonStage?.id;
  }, [stages]);
  
  const lostStageId = useMemo(() => {
    const lostStage = stages.find(stage => stage.is_lost);
    return lostStage?.id;
  }, [stages]);

  const createFunnel = useCallback(async (name: string, description?: string) => {
    if (!user?.id) return;
    try {
      const { data, error: createError } = await supabase
        .from('funnels')
        .insert([{
          name,
          description,
          created_by_user_id: user.id,
          is_active: true
        }])
        .select()
        .single();

      if (createError) throw createError;
      toast.success('Funil criado com sucesso!');
      await fetchFunnels();
      setSelectedFunnel(data);
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao criar funil:', err);
      toast.error('Erro ao criar funil');
    }
  }, [user?.id, fetchFunnels]);

  const openLeadDetail = useCallback((lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  const updateLeadNotes = useCallback(async (notes: string) => {
    if (!selectedLead) return;
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ notes })
        .eq('id', selectedLead.id);

      if (updateError) throw updateError;
      toast.success('Notas atualizadas com sucesso!');
      await fetchLeads();
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao atualizar notas:', err);
      toast.error('Erro ao atualizar notas');
    }
  }, [selectedLead, fetchLeads]);

  const updateLeadPurchaseValue = useCallback(async (value: number | undefined) => {
    if (!selectedLead) return;
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ purchase_value: value })
        .eq('id', selectedLead.id);

      if (updateError) throw updateError;
      toast.success('Valor atualizado com sucesso!');
      await fetchLeads();
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao atualizar valor:', err);
      toast.error('Erro ao atualizar valor');
    }
  }, [selectedLead, fetchLeads]);

  const updateLeadAssignedUser = useCallback(async (ownerId: string) => {
    if (!selectedLead) return;
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ owner_id: ownerId })
        .eq('id', selectedLead.id);

      if (updateError) throw updateError;
      toast.success('Responsável atualizado com sucesso!');
      await fetchLeads();
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao atualizar responsável:', err);
      toast.error('Erro ao atualizar responsável');
    }
  }, [selectedLead, fetchLeads]);

  const updateLeadName = useCallback(async (name: string) => {
    if (!selectedLead) return;
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ name })
        .eq('id', selectedLead.id);

      if (updateError) throw updateError;
      toast.success('Nome atualizado com sucesso!');
      await fetchLeads();
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao atualizar nome:', err);
      toast.error('Erro ao atualizar nome');
    }
  }, [selectedLead, fetchLeads]);

  const refetchLeads = useCallback(async () => {
    await fetchLeads();
  }, [fetchLeads]);

  const refetchStages = useCallback(async () => {
    await fetchStages();
  }, [fetchStages]);

  return {
    loading,
    error,
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    stages,
    leads,
    availableTags: [],
    wonStageId,
    lostStageId,
    openLeadDetail,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    refetchLeads,
    refetchStages,
    toggleTagOnLead: () => {},
    deleteColumn: () => {},
    addColumn: () => {},
    updateColumn: () => {},
    createTag: () => {},
    moveLeadToStage: () => {}
  };
}
