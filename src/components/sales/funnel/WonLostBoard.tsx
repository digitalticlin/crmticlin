import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanBoard } from "../KanbanBoard";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";
import { FunnelLoadingState } from "./FunnelLoadingState";

interface WonLostBoardProps {
  funnelId: string;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onReturnToFunnel: (lead: KanbanLead) => void;
  searchTerm?: string;
  selectedTags?: string[];
  selectedUser?: string;
}

export const WonLostBoard = ({
  funnelId,
  onOpenLeadDetail,
  onOpenChat,
  onReturnToFunnel,
  searchTerm = "",
  selectedTags = [],
  selectedUser = ""
}: WonLostBoardProps) => {

  // TODOS OS HOOKS DEVEM SER DECLARADOS PRIMEIRO, NA MESMA ORDEM

  // Buscar etapas do funil - Mudando para kanban_stages para corrigir 404
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['kanban-stages', funnelId],
    queryFn: async () => {
      console.log('[WonLostBoard] 🔍 Buscando stages para funil:', funnelId);

      const { data, error } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('order_position');

      if (error) {
        console.error('[WonLostBoard] ❌ Erro ao buscar stages:', error);
        throw error;
      }

      console.log('[WonLostBoard] ✅ Stages encontradas:', data?.length || 0);
      return data || [];
    },
    enabled: !!funnelId
  });

  // Definir IDs das stages won/lost - DECLARAR PRIMEIRO
  const wonStageId = useMemo(() => {
    return stages?.find(s => s.is_won)?.id || 'won-stage';
  }, [stages]);

  const lostStageId = useMemo(() => {
    return stages?.find(s => s.is_lost)?.id || 'lost-stage';
  }, [stages]);

  // Buscar leads ganhos e perdidos por etapas do funil - DEPOIS DOS IDs
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['won-lost-leads', funnelId, wonStageId, lostStageId],
    queryFn: async () => {
      console.log('[WonLostBoard] 🔍 Buscando leads won/lost para funil:', funnelId);
      console.log('[WonLostBoard] 🎯 Etapas Won/Lost:', { wonStageId, lostStageId });

      // Primeiro, verificar se temos as etapas Won/Lost
      if (!wonStageId && !lostStageId) {
        console.log('[WonLostBoard] ⚠️ Nenhuma etapa Won/Lost encontrada');
        return [];
      }

      // Buscar leads que estão nas etapas Won ou Lost do funil
      const stageIds = [wonStageId, lostStageId].filter(Boolean);

      const { data: leadsWithoutTags, error: errorWithoutTags } = await supabase
        .from('leads')
        .select('*')
        .eq('funnel_id', funnelId)
        .in('kanban_stage_id', stageIds)
        .order('updated_at', { ascending: false });

      if (errorWithoutTags) {
        console.error('[WonLostBoard] ❌ Erro ao buscar leads:', errorWithoutTags);
        throw errorWithoutTags;
      }

      console.log('[WonLostBoard] ✅ Leads encontrados:', leadsWithoutTags?.length || 0);
      console.log('[WonLostBoard] 🔍 Debug leads encontrados:',
        leadsWithoutTags?.map(lead => ({
          id: lead.id,
          name: lead.name,
          kanban_stage_id: lead.kanban_stage_id,
          isInWonStage: lead.kanban_stage_id === wonStageId,
          isInLostStage: lead.kanban_stage_id === lostStageId
        }))
      );

      // Transformar para formato KanbanLead
      return (leadsWithoutTags || []).map(lead => ({
        id: lead.id,
        name: lead.name || 'Lead sem nome',
        phone: lead.phone || '',
        email: lead.email,
        company: lead.company,
        status: lead.status || 'active', // Status padrão
        columnId: lead.kanban_stage_id,
        assignedUser: lead.assigned_user_id,
        purchaseValue: lead.purchase_value || 0,
        purchase_value: lead.purchase_value || 0,
        tags: [], // Sem tags por enquanto
        created_at: lead.created_at,
        updated_at: lead.updated_at
      })) as KanbanLead[];
    },
    enabled: !!funnelId && (!!wonStageId || !!lostStageId)
  });

  // Callback estável para não causar re-renders - SEMPRE declarado
  const handleColumnsChange = useCallback(() => {
    // Won/Lost view não permite mudanças nas colunas
  }, []);

  // Criar colunas filtradas para Won/Lost - SEMPRE executado
  const wonLostColumns = useMemo(() => {
    if (!stages || !leads) return [];

    // Criar etapas FIXAS para Won e Lost - sempre as mesmas 2 colunas
    const wonStage = {
      id: wonStageId,
      title: 'GANHO',
      is_won: true,
      is_lost: false
    };

    const lostStage = {
      id: lostStageId,
      title: 'PERDIDO',
      is_won: false,
      is_lost: true
    };

    const wonLostStages = [wonStage, lostStage];

    return wonLostStages.map(stage => {
      // Buscar leads dessa etapa específica
      let stageLeads = leads.filter(lead => {
        return lead.columnId === stage.id;
      });

      // Aplicar filtros de busca
      if (searchTerm) {
        stageLeads = stageLeads.filter(lead =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Aplicar filtros de tags
      if (selectedTags.length > 0) {
        stageLeads = stageLeads.filter(lead =>
          lead.tags?.some(tag => selectedTags.includes(tag.id))
        );
      }

      // Aplicar filtros de usuário
      if (selectedUser && selectedUser !== "all") {
        stageLeads = stageLeads.filter(lead => lead.assignedUser === selectedUser);
      }

      return {
        id: stage.id,
        title: stage.title,
        leads: stageLeads,
        color: stage.is_won ? "#10b981" : "#ef4444", // Verde para ganho, vermelho para perdido
        isFixed: true,
        isHidden: false
      } as KanbanColumn;
    });
  }, [stages, leads, searchTerm, selectedTags, selectedUser, wonStageId, lostStageId]);

  // Loading check DEPOIS de todos os hooks
  if (stagesLoading || leadsLoading) {
    return <FunnelLoadingState />;
  }

  console.log('[WonLostBoard] 📊 Colunas Won/Lost:', {
    stagesCount: stages?.length || 0,
    leadsCount: leads?.length || 0,
    wonLostColumnsCount: wonLostColumns.length,
    columnsData: wonLostColumns.map(c => ({ title: c.title, leadsCount: c.leads.length }))
  });

  if (wonLostColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum lead ganho ou perdido
          </h3>
          <p className="text-gray-600">
            Os leads marcados como ganhos ou perdidos aparecerão aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <KanbanBoard
      columns={wonLostColumns}
      onColumnsChange={handleColumnsChange}
      onOpenLeadDetail={onOpenLeadDetail}
      onOpenChat={onOpenChat}
      onReturnToFunnel={onReturnToFunnel}
      isWonLostView={true}
      wonStageId={wonStageId}
      lostStageId={lostStageId}
    />
  );
};