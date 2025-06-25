import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { toast } from "sonner";

interface FunnelData {
  id: string;
  name: string;
  description?: string;
  created_by_user_id: string;
  created_at?: string;
}

interface StageData {
  id: string;
  title: string;
  color: string;
  order_position: number;
  is_won: boolean;
  is_lost: boolean;
  is_fixed: boolean;
}

interface LeadData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  kanban_stage_id: string;
  notes?: string;
  purchase_value?: number;
  owner_id?: string;
  last_message?: string;
  last_message_time?: string;
  created_at: string;
  address?: string;
  company?: string;
  document_id?: string;
}

export function useSalesFunnelDirect() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados simples e diretos
  const [funnels, setFunnels] = useState<FunnelData[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelData | null>(null);
  const [stages, setStages] = useState<StageData[]>([]);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);

  console.group('[useSalesFunnelDirect] 🚀 Hook Debug Info');
  console.log('📊 Estado atual:', {
    userId: user?.id,
    loading,
    error,
    funnelsCount: funnels.length,
    selectedFunnelId: selectedFunnel?.id,
    stagesCount: stages.length,
    leadsCount: leads.length
  });
  console.groupEnd();

  // Validação robusta de dados
  const validateData = useCallback((type: string, data: any) => {
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
  }, []);

  // Buscar funis
  const fetchFunnels = useCallback(async () => {
    if (!user?.id) {
      console.log('[useSalesFunnelDirect] ⚠️ Sem usuário para buscar funis');
      return;
    }

    try {
      console.log('[useSalesFunnelDirect] 📊 Buscando funis para usuário:', user.id);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('funnels')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('is_active', true);

      if (fetchError) {
        console.error('[useSalesFunnelDirect] ❌ Erro Supabase:', fetchError);
        throw fetchError;
      }

      if (!validateData('Funnels', data)) {
        throw new Error('Dados de funis inválidos recebidos do Supabase');
      }

      console.log('[useSalesFunnelDirect] ✅ Funis encontrados:', data?.length || 0);
      setFunnels(data || []);
      
      // Auto-selecionar primeiro funil
      if (data && data.length > 0 && !selectedFunnel) {
        setSelectedFunnel(data[0]);
        console.log('[useSalesFunnelDirect] 🎯 Auto-selecionado funil:', data[0].name);
      }
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao buscar funis:', err);
      setError(`Erro ao carregar funis: ${err.message}`);
      toast.error('Erro ao carregar funis');
    }
  }, [user?.id, selectedFunnel, validateData]);

  // Buscar stages
  const fetchStages = useCallback(async () => {
    if (!selectedFunnel?.id) {
      console.log('[useSalesFunnelDirect] ⚠️ Sem funil selecionado para buscar stages');
      return;
    }

    try {
      console.log('[useSalesFunnelDirect] 📊 Buscando stages para funil:', selectedFunnel.id);
      
      const { data, error: fetchError } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', selectedFunnel.id)
        .order('order_position');

      if (fetchError) {
        console.error('[useSalesFunnelDirect] ❌ Erro Supabase stages:', fetchError);
        throw fetchError;
      }

      if (!validateData('Stages', data)) {
        throw new Error('Dados de stages inválidos recebidos do Supabase');
      }

      console.log('[useSalesFunnelDirect] ✅ Stages encontrados:', data?.length || 0);
      setStages(data || []);
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao buscar stages:', err);
      setError(`Erro ao carregar etapas: ${err.message}`);
      toast.error('Erro ao carregar etapas');
    }
  }, [selectedFunnel?.id, validateData]);

  // Buscar leads
  const fetchLeads = useCallback(async () => {
    if (!selectedFunnel?.id) {
      console.log('[useSalesFunnelDirect] ⚠️ Sem funil selecionado para buscar leads');
      return;
    }

    try {
      console.log('[useSalesFunnelDirect] 📊 Buscando leads para funil:', selectedFunnel.id);
      
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('funnel_id', selectedFunnel.id);

      if (fetchError) {
        console.error('[useSalesFunnelDirect] ❌ Erro Supabase leads:', fetchError);
        throw fetchError;
      }

      if (!validateData('Leads', data)) {
        throw new Error('Dados de leads inválidos recebidos do Supabase');
      }

      console.log('[useSalesFunnelDirect] ✅ Leads encontrados:', data?.length || 0);
      setLeads(data || []);
    } catch (err: any) {
      console.error('[useSalesFunnelDirect] ❌ Erro ao buscar leads:', err);
      setError(`Erro ao carregar leads: ${err.message}`);
      toast.error('Erro ao carregar leads');
    }
  }, [selectedFunnel?.id, validateData]);

  // Effect para carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      console.log('[useSalesFunnelDirect] 🔄 Iniciando carregamento de dados');
      setLoading(true);
      fetchFunnels();
    }
  }, [user?.id, fetchFunnels]);

  // Effect para carregar stages quando funil muda
  useEffect(() => {
    if (selectedFunnel?.id) {
      fetchStages();
    }
  }, [selectedFunnel?.id, fetchStages]);

  // Effect para carregar leads quando funil muda
  useEffect(() => {
    if (selectedFunnel?.id) {
      fetchLeads();
    }
  }, [selectedFunnel?.id, fetchLeads]);

  // Effect para marcar loading como false
  useEffect(() => {
    if (funnels.length > 0 || error) {
      console.log('[useSalesFunnelDirect] ✅ Carregamento concluído');
      setLoading(false);
    }
  }, [funnels.length, error]);

  // Transformar dados em colunas Kanban
  const columns = useMemo((): KanbanColumn[] => {
    try {
      console.group('[useSalesFunnelDirect] 🔄 Transformando dados em colunas');
      
      if (!stages.length) {
        console.log('[useSalesFunnelDirect] ⚠️ Sem stages para criar colunas');
        console.groupEnd();
        return [];
      }

      // Filtrar apenas etapas do funil principal (não GANHO/PERDIDO)
      const mainStages = stages.filter(stage => !stage.is_won && !stage.is_lost);
      console.log('[useSalesFunnelDirect] 📊 Stages principais:', mainStages.length);
      
      const kanbanColumns: KanbanColumn[] = mainStages.map(stage => {
        // Encontrar leads para este stage
        const stageLeads = leads
          .filter(lead => lead.kanban_stage_id === stage.id)
          .map((lead): KanbanLead => {
            try {
              return {
                id: lead.id,
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                columnId: stage.id,
                tags: [], // Simplificado por agora
                notes: lead.notes,
                purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
                assignedUser: lead.owner_id,
                lastMessage: lead.last_message || '',
                lastMessageTime: lead.last_message_time || '',
                created_at: lead.created_at,
                address: lead.address,
                company: lead.company,
                documentId: lead.document_id
              };
            } catch (leadError) {
              console.error('[useSalesFunnelDirect] ❌ Erro ao transformar lead:', lead.id, leadError);
              throw new Error(`Erro ao transformar lead ${lead.id}: ${leadError}`);
            }
          });

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
        columnsCount: kanbanColumns.length,
        totalLeads: kanbanColumns.reduce((sum, col) => sum + col.leads.length, 0),
        columns: kanbanColumns.map(c => ({ title: c.title, leadsCount: c.leads.length }))
      });
      console.groupEnd();

      return kanbanColumns;
    } catch (err) {
      console.error('[useSalesFunnelDirect] ❌ Erro crítico na transformação de colunas:', err);
      console.groupEnd();
      setError(`Erro na transformação de dados: ${err}`);
      return [];
    }
  }, [stages, leads]);

  // Função para atualizar colunas (necessária para drag and drop)
  const setColumns = useCallback((newColumns: KanbanColumn[]) => {
    try {
      console.log('[useSalesFunnelDirect] 🔄 Atualizando colunas:', newColumns.length);
      
      if (!validateData('NewColumns', newColumns)) {
        throw new Error('Colunas inválidas recebidas no setColumns');
      }
      
      console.log('[useSalesFunnelDirect] 📝 Movimentação de leads:', {
        columnsCount: newColumns.length,
        totalLeads: newColumns.reduce((sum, col) => sum + col.leads.length, 0)
      });
      
      // Aqui você pode implementar a lógica para sincronizar com o banco
      // Por agora, vamos apenas logar para não quebrar o drag and drop
    } catch (err) {
      console.error('[useSalesFunnelDirect] ❌ Erro em setColumns:', err);
      setError(`Erro ao atualizar colunas: ${err}`);
    }
  }, [validateData]);

  // Identificar stages especiais
  const wonStageId = useMemo(() => {
    const wonStage = stages.find(stage => stage.is_won);
    console.log('[useSalesFunnelDirect] 🏆 Won Stage ID:', wonStage?.id);
    return wonStage?.id;
  }, [stages]);
  
  const lostStageId = useMemo(() => {
    const lostStage = stages.find(stage => stage.is_lost);
    console.log('[useSalesFunnelDirect] 💀 Lost Stage ID:', lostStage?.id);
    return lostStage?.id;
  }, [stages]);

  // Ações do funil
  const createFunnel = useCallback(async (name: string, description?: string) => {
    if (!user?.id) return;

    try {
      console.log('[useSalesFunnelDirect] ➕ Criando funil:', name);
      
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

  // Ações de lead
  const openLeadDetail = useCallback((lead: KanbanLead) => {
    console.log('[useSalesFunnelDirect] 👤 Abrindo detalhes do lead:', lead.id);
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

  // Funções de recarga
  const refetchLeads = useCallback(async () => {
    await fetchLeads();
  }, [fetchLeads]);

  const refetchStages = useCallback(async () => {
    await fetchStages();
  }, [fetchStages]);

  // Log final do estado
  console.group('[useSalesFunnelDirect] 📋 Estado final do hook');
  console.log('🎯 Dados finais:', {
    loading,
    error,
    funnelsCount: funnels.length,
    selectedFunnel: selectedFunnel?.name,
    stagesCount: stages.length,
    leadsCount: leads.length,
    columnsCount: columns.length,
    wonStageId,
    lostStageId
  });
  console.groupEnd();

  return {
    // Estados básicos
    loading,
    error,
    
    // Dados do funil
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    
    // Dados das colunas (compatível com drag and drop)
    columns,
    setColumns,
    
    // Estados do lead selecionado
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    
    // Dados básicos
    stages,
    leads,
    availableTags: [], // Simplificado por agora
    
    // IDs especiais
    wonStageId,
    lostStageId,
    
    // Ações
    openLeadDetail,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    refetchLeads,
    refetchStages,
    
    // Funções vazias para compatibilidade
    toggleTagOnLead: () => {},
    deleteColumn: () => {},
    addColumn: () => {},
    updateColumn: () => {},
    createTag: () => {},
    moveLeadToStage: () => {}
  };
} 