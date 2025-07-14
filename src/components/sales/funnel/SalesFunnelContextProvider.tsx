import { ReactNode, useMemo, useCallback } from 'react';
import { SalesFunnelProvider } from './SalesFunnelProvider';
import { useSalesFunnelDirect } from '@/hooks/salesFunnel/useSalesFunnelDirect';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KanbanLead } from '@/types/kanban';

interface SalesFunnelContextProviderProps {
  children: ReactNode;
}

// Função para transformar lead do banco para KanbanLead
const transformLeadToKanbanLead = (lead: any): KanbanLead => ({
  id: lead.id,
  name: lead.name,
  phone: lead.phone,
  email: lead.email || undefined,
  company: lead.company || undefined,
  lastMessage: lead.last_message || "Sem mensagens",
  lastMessageTime: lead.last_message_time 
    ? new Date(lead.last_message_time).toISOString() 
    : new Date().toISOString(),
  tags: [],
  notes: lead.notes || undefined,
  columnId: lead.kanban_stage_id || undefined,
  purchaseValue: lead.purchase_value ? Number(lead.purchase_value) : undefined,
  assignedUser: lead.owner_id || undefined,
  unreadCount: lead.unread_count || 0,
  avatar: undefined,
  created_at: lead.created_at,
  updated_at: lead.updated_at,
  company_id: undefined,
  whatsapp_number_id: lead.whatsapp_number_id || undefined,
  funnel_id: lead.funnel_id,
  kanban_stage_id: lead.kanban_stage_id || undefined,
  owner_id: lead.owner_id || undefined,
  // Propriedades do banco para compatibilidade
  last_message: lead.last_message,
  purchase_value: lead.purchase_value,
  unread_count: lead.unread_count,
  documentId: (lead as any).document_id || undefined,
  address: (lead as any).address || undefined,
  city: undefined,
  state: undefined,
  country: undefined,
  zip_code: undefined
});

// Hook customizado para operações de colunas
const useColumnOperations = (user: any, salesFunnelData: any) => {
  // Função para adicionar nova coluna
  const addColumn = useCallback(async (title: string, color: string = "#3b82f6"): Promise<void> => {
    console.log('[SalesFunnelContextProvider] ➕ Adicionando nova etapa:', { title, color });
    
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    if (!title.trim()) {
      toast.error("Nome da etapa é obrigatório");
      return;
    }

    // Verificar se há um funil selecionado
    if (!salesFunnelData.selectedFunnel?.id) {
      toast.error("Nenhum funil selecionado");
      return;
    }

    try {
      // Buscar próxima posição
      const { data: existingStages, error: fetchError } = await supabase
        .from('kanban_stages')
        .select('order_position')
        .eq('created_by_user_id', user.id)
        .eq('funnel_id', salesFunnelData.selectedFunnel.id)
        .order('order_position', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const nextPosition = (existingStages?.[0]?.order_position || 0) + 1;

      // Criar nova etapa
      const { data: newStage, error } = await supabase
        .from('kanban_stages')
        .insert({
          title: title.trim(),
          color: color,
          order_position: nextPosition,
          funnel_id: salesFunnelData.selectedFunnel.id,
          created_by_user_id: user.id,
          ai_enabled: false // Padrão OFF para IA
        })
        .select()
        .single();

      if (error) throw error;

      console.log('[SalesFunnelContextProvider] ✅ Nova etapa criada:', newStage);
      
      toast.success(`Etapa "${title}" criada com sucesso!`, {
        description: "A nova etapa foi adicionada ao funil"
      });

      // Refrescar dados
      if (salesFunnelData.refetchStages) {
        await salesFunnelData.refetchStages();
      }

    } catch (error: any) {
      console.error('[SalesFunnelContextProvider] ❌ Erro ao criar etapa:', error);
      toast.error("Erro ao criar etapa", {
        description: error.message || "Tente novamente"
      });
      throw error;
    }
  }, [user?.id, salesFunnelData.selectedFunnel?.id, salesFunnelData.refetchStages]);

  // Função para atualizar coluna existente
  const updateColumn = useCallback(async (column: any): Promise<void> => {
    console.log('[SalesFunnelContextProvider] ✏️ Atualizando etapa:', { 
      id: column.id,
      title: column.title, 
      color: column.color 
    });
    
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      const { error } = await supabase
        .from('kanban_stages')
        .update({
          title: column.title.trim(),
          color: column.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', column.id)
        .eq('created_by_user_id', user.id);

      if (error) throw error;

      console.log('[SalesFunnelContextProvider] ✅ Etapa atualizada:', column.title);
      
      toast.success(`Etapa "${column.title}" atualizada com sucesso!`, {
        description: "As alterações foram salvas"
      });

      if (salesFunnelData.refetchStages) {
        await salesFunnelData.refetchStages();
      }

    } catch (error: any) {
      console.error('[SalesFunnelContextProvider] ❌ Erro ao atualizar etapa:', error);
      toast.error("Erro ao atualizar etapa", {
        description: error.message || "Tente novamente"
      });
      throw error;
    }
  }, [user?.id, salesFunnelData.refetchStages]);

  // Função para deletar coluna
  const deleteColumn = useCallback(async (columnId: string): Promise<void> => {
    console.log('[SalesFunnelContextProvider] 🗑️ Excluindo etapa:', columnId);
    
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      // Verificar se a etapa tem leads associados
      const { data: leadsCount, error: countError } = await supabase
        .from('leads')
        .select('id', { count: 'exact' })
        .eq('kanban_stage_id', columnId);

      if (countError) throw countError;

      if (leadsCount && leadsCount.length > 0) {
        toast.error("Não é possível excluir etapa com leads", {
          description: `Esta etapa possui ${leadsCount.length} lead(s). Mova-os primeiro.`
        });
        return;
      }

      const { error } = await supabase
        .from('kanban_stages')
        .delete()
        .eq('id', columnId)
        .eq('created_by_user_id', user.id);

      if (error) throw error;

      console.log('[SalesFunnelContextProvider] ✅ Etapa excluída:', columnId);
      
      toast.success("Etapa excluída com sucesso!", {
        description: "A etapa foi removida do funil"
      });

      if (salesFunnelData.refetchStages) {
        await salesFunnelData.refetchStages();
      }

    } catch (error: any) {
      console.error('[SalesFunnelContextProvider] ❌ Erro ao excluir etapa:', error);
      toast.error("Erro ao excluir etapa", {
        description: error.message || "Tente novamente"
      });
      throw error;
    }
  }, [user?.id, salesFunnelData.refetchStages]);

  return { addColumn, updateColumn, deleteColumn };
};

// Hook customizado para operações de leads
const useLeadOperations = () => {
  const createTag = useCallback((name: string, color: string) => {
    console.log('[SalesFunnelContextProvider] 🏷️ Criando tag:', name, color);
    // Implementação futura
  }, []);

  const moveLeadToStage = useCallback((lead: any, columnId: string) => {
    console.log('[SalesFunnelContextProvider] 🔄 Movendo lead:', lead.name, 'para', columnId);
    // Implementação futura
  }, []);

  return { createTag, moveLeadToStage };
};

export const SalesFunnelContextProvider = ({ children }: SalesFunnelContextProviderProps) => {
  console.log('[SalesFunnelContextProvider] 🔄 Renderizando contexto OTIMIZADO');
  
  const { user } = useAuth();
  const salesFunnelData = useSalesFunnelDirect();
  
  // Verificar se o usuário é admin
  const isAdmin = useMemo(() => 
    user?.user_metadata?.role === 'admin' || user?.email === 'inacio@ticlin.com.br',
    [user?.user_metadata?.role, user?.email]
  );

  // Hooks para operações
  const { addColumn, updateColumn, deleteColumn } = useColumnOperations(user, salesFunnelData);
  const { createTag, moveLeadToStage } = useLeadOperations();

  // Memoização dos dados transformados
  const transformedColumns = useMemo(() => 
    (salesFunnelData.columns || []).map(column => ({
      ...column,
      ai_enabled: column.ai_enabled === true
    })),
    [salesFunnelData.columns]
  );

  const transformedLeads = useMemo(() => 
    (salesFunnelData.leads || []).map(transformLeadToKanbanLead),
    [salesFunnelData.leads]
  );

  // Contexto memoizado para evitar re-renders desnecessários
  const contextValue = useMemo(() => ({
    // Estado de carregamento
    loading: salesFunnelData.loading || false,
    error: salesFunnelData.error || null,
    
    // Funnel data - sempre disponível com fallbacks
    funnels: salesFunnelData.funnels || [],
    selectedFunnel: salesFunnelData.selectedFunnel || null,
    setSelectedFunnel: salesFunnelData.setSelectedFunnel,
    createFunnel: salesFunnelData.createFunnel,
    funnelLoading: salesFunnelData.loading || false,
    
    // Dados transformados
    columns: transformedColumns,
    setColumns: salesFunnelData.setColumns || (() => {}),
    selectedLead: salesFunnelData.selectedLead || null,
    isLeadDetailOpen: salesFunnelData.isLeadDetailOpen || false,
    setIsLeadDetailOpen: salesFunnelData.setIsLeadDetailOpen || (() => {}),
    availableTags: salesFunnelData.availableTags || [],
    stages: salesFunnelData.stages || [],
    leads: transformedLeads,
    
    // Ações de colunas
    addColumn,
    updateColumn,
    deleteColumn,
    
    // Ações de leads
    openLeadDetail: salesFunnelData.openLeadDetail || (() => {}),
    toggleTagOnLead: salesFunnelData.toggleTagOnLead || (() => {}),
    createTag,
    updateLeadNotes: salesFunnelData.updateLeadNotes || (() => {}),
    updateLeadPurchaseValue: salesFunnelData.updateLeadPurchaseValue || (() => {}),
    updateLeadAssignedUser: salesFunnelData.updateLeadAssignedUser || (() => {}),
    updateLeadName: salesFunnelData.updateLeadName || (() => {}),
    moveLeadToStage,
    
    // Configurações
    isAdmin,
    wonStageId: salesFunnelData.wonStageId,
    lostStageId: salesFunnelData.lostStageId,
    
    // Funções de refresh
    refetchLeads: salesFunnelData.refetchLeads || (async () => {}),
    refetchStages: salesFunnelData.refetchStages || (async () => {})
  }), [
    salesFunnelData,
    transformedColumns,
    transformedLeads,
    addColumn,
    updateColumn,
    deleteColumn,
    createTag,
    moveLeadToStage,
    isAdmin
  ]);

  console.log('[SalesFunnelContextProvider] ✅ Fornecendo contexto OTIMIZADO estável');

  return (
    <SalesFunnelProvider value={contextValue}>
      {children}
    </SalesFunnelProvider>
  );
};
