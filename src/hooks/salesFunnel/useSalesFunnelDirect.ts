import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KanbanColumn, KanbanLead, KanbanTag } from '@/types/kanban';
import { KanbanStage, Funnel } from '@/types/funnel';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

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
  availableTags: KanbanTag[];
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
  const [availableTags, setAvailableTags] = useState<KanbanTag[]>([]);
  const { user } = useAuth();

  // Buscar IDs de estágios "ganho" e "perdido"
  const wonStageId = stages.find(stage => stage.is_won)?.id;
  const lostStageId = stages.find(stage => stage.is_lost)?.id;

  // 🚀 MUTATION PARA ATUALIZAR LEAD
  const updateLead = useMutation({
    mutationFn: async ({ leadId, fields }: { leadId: string; fields: Partial<KanbanLead> }) => {
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
      return data;
    },
    onError: (err: any) => {
      console.error('[Sales Funnel Direct] ❌ Erro crítico ao atualizar lead:', err);
      toast.error(`Erro ao atualizar lead: ${err.message}`);
    }
  });

  // 🔄 REFRESH FUNCTIONS
  const refetchFunnels = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('created_by_user_id', user.id);

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
        .order('order_position', { ascending: true });

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
        // Transform database data to KanbanLead format
        const transformedLeads: KanbanLead[] = (data || []).map(lead => ({
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          company: lead.company,
          lastMessage: lead.last_message || '',
          lastMessageTime: lead.last_message_time || new Date().toISOString(),
          tags: [], // Will be populated from lead_tags if needed
          notes: lead.notes,
          columnId: lead.kanban_stage_id,
          purchaseValue: lead.purchase_value,
          assignedUser: lead.owner_id,
          unreadCount: lead.unread_count || 0,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          whatsapp_number_id: lead.whatsapp_number_id,
          funnel_id: lead.funnel_id,
          kanban_stage_id: lead.kanban_stage_id,
          owner_id: lead.owner_id,
          last_message: lead.last_message,
          purchase_value: lead.purchase_value,
          unread_count: lead.unread_count,
          documentId: lead.document_id,
          address: lead.address,
          import_source: lead.import_source
        }));
        
        setLeads(transformedLeads);
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
        // Set mock tags for now
        setAvailableTags([
          { id: '1', name: 'Prioridade Alta', color: '#ef4444' },
          { id: '2', name: 'Interessado', color: '#10b981' },
          { id: '3', name: 'Acompanhar', color: '#f59e0b' }
        ]);
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
        .insert([{ name, created_by_user_id: user.id }])
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
    if (!selectedFunnel || !user) return;

    try {
      const { data, error } = await supabase
        .from('kanban_stages')
        .insert([
          {
            title,
            color,
            funnel_id: selectedFunnel.id,
            created_by_user_id: user.id,
            order_position: stages.length,
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
  }, [selectedFunnel, user, stages.length, refetchStages]);

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

  const openLeadDetail = useCallback((lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsLeadDetailOpen(true);
  }, []);

  const toggleTagOnLead = useCallback(async (leadId: string, tag: string) => {
    console.log('toggleTagOnLead', leadId, tag);
  }, []);

  const updateLeadNotes = useCallback(async (leadId: string, notes: string) => {
    try {
      await updateLead.mutateAsync({ leadId, fields: { notes } });
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
      await updateLead.mutateAsync({ leadId, fields: { purchase_value: purchaseValue } });
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
      await updateLead.mutateAsync({ leadId, fields: { owner_id: assignedUser } });
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
      await updateLead.mutateAsync({ leadId, fields: { name } });
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
