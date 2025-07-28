import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KanbanColumn, KanbanLead } from '@/types/kanban';
import { KanbanStage, Funnel } from '@/types/funnel';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseSalesFunnelDirectResult {
  loading: boolean;
  error: Error | null;
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  setSelectedFunnel: (funnel: Funnel) => void;
  createFunnel: (name: string, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void;
  funnelLoading: boolean;
  columns: KanbanColumn[];
  setColumns: (columns: KanbanColumn[]) => void;
  stages: KanbanStage[];
  leads: KanbanLead[];
  wonStageId: string | undefined;
  lostStageId: string | undefined;
  selectedLead: KanbanLead | null;
  isLeadDetailOpen: boolean;
  setIsLeadDetailOpen: (isOpen: boolean) => void;
  availableTags: string[];
  addColumn: (title: string, color: string) => Promise<void>;
  updateColumn: (column: KanbanColumn) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  openLeadDetail: (lead: KanbanLead) => void;
  toggleTagOnLead: (leadId: string, tag: string) => Promise<void>;
  updateLeadNotes: (leadId: string, notes: string) => Promise<void>;
  updateLeadPurchaseValue: (leadId: string, purchaseValue: number | undefined) => Promise<void>;
  updateLeadAssignedUser: (leadId: string, assignedUser: string | undefined) => Promise<void>;
  updateLeadName: (leadId: string, name: string) => Promise<void>;
  refetchLeads: () => Promise<void>;
  refetchStages: () => Promise<void>;
  updateLead: any;
}

export const useSalesFunnelDirect = (): UseSalesFunnelDirectResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [stages, setStages] = useState<KanbanStage[]>([]);
  const [leads, setLeads] = useState<KanbanLead[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isLeadDetailOpen, setIsLeadDetailOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const { user } = useAuth();

  // Buscar IDs de estágios "ganho" e "perdido"
  const wonStageId = stages.find(stage => stage.is_won)?.id;
  const lostStageId = stages.find(stage => stage.is_lost)?.id;

  // 🚀 MUTATION PARA ATUALIZAR LEAD
  const updateLead = useCallback(async (
    { leadId, fields }: { leadId: string; fields: Partial<KanbanLead> }
  ) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(fields)
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('[Sales Funnel Direct] ❌ Erro ao atualizar lead:', error);
        throw new Error(error.message);
      }

      console.log('[Sales Funnel Direct] 👤 Lead atualizado:', data);
      // refetchLeads(); // Realtime vai atualizar
      return data;
    } catch (err: any) {
      console.error('[Sales Funnel Direct] ❌ Erro crítico ao atualizar lead:', err);
      toast.error(`Erro ao atualizar lead: ${err.message}`);
      throw err; // Rejeitar para tratamento no componente
    }
  }, []);

  // 🔄 REFRESH FUNCTIONS
  const refetchFunnels = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('company_id', user.company_id);

      if (error) {
        console.error('Erro ao buscar funnels:', error);
        setError(error);
      } else {
        setFunnels(data || []);
        if (data && data.length > 0 && !selectedFunnel) {
          setSelectedFunnel(data[0]);
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar funnels:', error);
      setError(error);
    }
  }, [user, selectedFunnel]);

  const refetchStages = useCallback(async () => {
    if (!selectedFunnel) return;
    try {
      const { data, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', selectedFunnel.id)
        .order('position', { ascending: true });

      if (error) {
        console.error('Erro ao buscar stages:', error);
        setError(error);
      } else {
        setStages(data || []);
      }
    } catch (error: any) {
      console.error('Erro ao buscar stages:', error);
      setError(error);
    }
  }, [selectedFunnel]);

  const refetchLeads = useCallback(async () => {
    if (!selectedFunnel) return;
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('funnel_id', selectedFunnel.id);

      if (error) {
        console.error('Erro ao buscar leads:', error);
        setError(error);
      } else {
        setLeads(data || []);
      }
    } catch (error: any) {
      console.error('Erro ao buscar leads:', error);
      setError(error);
    }
  }, [selectedFunnel]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await refetchFunnels();
        setAvailableTags(['Tag 1', 'Tag 2', 'Tag 3']);
      } catch (error: any) {
        console.error('Erro ao buscar dados:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refetchFunnels]);

  useEffect(() => {
    if (selectedFunnel) {
      refetchStages();
      refetchLeads();
    }
  }, [selectedFunnel, refetchStages, refetchLeads]);

  useEffect(() => {
    if (stages.length > 0) {
      const newColumns = stages.map(stage => ({
        id: stage.id,
        title: stage.title,
        leads: leads.filter(lead => lead.kanban_stage_id === stage.id),
        color: stage.color,
        isFixed: stage.is_won || stage.is_lost,
        isHidden: false
      }));
      setColumns(newColumns);
    }
  }, [stages, leads]);

  // 🚀 FUNÇÕES DE GERENCIAMENTO DE FUNIL
  const createFunnel = useCallback(async (name: string, options: { onSuccess?: () => void; onError?: (error: Error) => void } = {}) => {
    if (!user) return;

    setFunnelLoading(true);
    try {
      const { data, error } = await supabase
        .from('funnels')
        .insert([{ name, company_id: user.company_id }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar funnel:', error);
        setError(error);
        options.onError?.(error);
      } else {
        console.log('Funnel criado:', data);
        setFunnels([...funnels, data]);
        setSelectedFunnel(data);
        options.onSuccess?.();
      }
    } catch (error: any) {
      console.error('Erro ao criar funnel:', error);
      setError(error);
      options.onError?.(error);
    } finally {
      setFunnelLoading(false);
    }
  }, [user, funnels]);

  // 🏗️ FUNÇÕES DE GERENCIAMENTO DE COLUNAS
  const addColumn = useCallback(async (title: string, color: string): Promise<void> => {
    if (!selectedFunnel) return;

    try {
      const { data, error } = await supabase
        .from('kanban_stages')
        .insert([
          {
            title,
            color,
            funnel_id: selectedFunnel.id,
            position: stages.length,
            is_won: false,
            is_lost: false
          }
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('[Sales Funnel Direct] ✅ Coluna adicionada:', data);
      await refetchStages();
    } catch (error) {
      console.error('[Sales Funnel Direct] ❌ Erro ao adicionar coluna:', error);
      throw error;
    }
  }, [selectedFunnel, stages.length, refetchStages]);

  const updateColumn = useCallback(async (column: KanbanColumn) => {
    try {
      const { data, error } = await supabase
        .from('kanban_stages')
        .update({ title: column.title, color: column.color })
        .eq('id', column.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar coluna:', error);
        setError(error);
      } else {
        console.log('Coluna atualizada:', data);
        setStages(stages.map(stage => stage.id === column.id ? { ...stage, title: column.title, color: column.color } : stage));
        setColumns(columns.map(col => col.id === column.id ? { ...col, title: column.title, color: column.color } : col));
      }
    } catch (error: any) {
      console.error('Erro ao atualizar coluna:', error);
      setError(error);
    }
  }, [stages, columns]);

  const deleteColumn = useCallback(async (columnId: string) => {
    try {
      const { error } = await supabase
        .from('kanban_stages')
        .delete()
        .eq('id', columnId);

      if (error) {
        console.error('Erro ao remover coluna:', error);
        setError(error);
      } else {
        console.log('Coluna removida:', columnId);
        setStages(stages.filter(stage => stage.id !== columnId));
        setColumns(columns.filter(col => col.id !== columnId));
      }
    } catch (error: any) {
      console.error('Erro ao remover coluna:', error);
      setError(error);
    }
  }, [stages, columns]);

  // 👤 FUNÇÕES DE GERENCIAMENTO DE LEAD
  const openLeadDetail = useCallback((lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  const toggleTagOnLead = useCallback(async (leadId: string, tag: string) => {
    console.log('toggleTagOnLead', leadId, tag);
  }, []);

  const updateLeadNotes = useCallback(async (leadId: string, notes: string) => {
    try {
      await updateLead({ leadId, fields: { notes } });
      setLeads(leads.map(lead => lead.id === leadId ? { ...lead, notes } : lead));
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, notes } as KanbanLead);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar notas do lead:', error);
      setError(error);
    }
  }, [leads, selectedLead, updateLead]);

  const updateLeadPurchaseValue = useCallback(async (leadId: string, purchaseValue: number | undefined) => {
    try {
      await updateLead({ leadId, fields: { purchase_value: purchaseValue } });
      setLeads(leads.map(lead => lead.id === leadId ? { ...lead, purchaseValue } : lead));
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, purchaseValue } as KanbanLead);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar valor de compra do lead:', error);
      setError(error);
    }
  }, [leads, selectedLead, updateLead]);

  const updateLeadAssignedUser = useCallback(async (leadId: string, assignedUser: string | undefined) => {
    try {
      await updateLead({ leadId, fields: { owner_id: assignedUser } });
      setLeads(leads.map(lead => lead.id === leadId ? { ...lead, assignedUser } : lead));
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, assignedUser } as KanbanLead);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar usuário atribuído ao lead:', error);
      setError(error);
    }
  }, [leads, selectedLead, updateLead]);

  const updateLeadName = useCallback(async (leadId: string, name: string) => {
    try {
      await updateLead({ leadId, fields: { name } });
      setLeads(leads.map(lead => lead.id === leadId ? { ...lead, name } : lead));
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, name } as KanbanLead);
      }
    } catch (error: any) {
      console.error('Erro ao atualizar nome do lead:', error);
      setError(error);
    }
  }, [leads, selectedLead, updateLead]);

  return {
    loading,
    error,
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    funnelLoading,
    columns,
    setColumns,
    stages,
    leads,
    wonStageId,
    lostStageId,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    refetchLeads,
    refetchStages,
    updateLead
  };
};
