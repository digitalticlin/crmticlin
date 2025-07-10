
import { useMemo } from "react";
import { KanbanColumn } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";

export const useKanbanColumns = (stages: KanbanStage[], leads: any[], funnelId?: string) => {
  // Memoizar as colunas com dependências estáveis para evitar recriações desnecessárias
  const columns = useMemo(() => {
    if (!stages?.length || !funnelId) {
      console.log('[useKanbanColumns] ⚠️ Sem stages ou funnelId:', { stagesCount: stages?.length || 0, funnelId });
      return [];
    }

    console.log('[useKanbanColumns] 🔍 Processando stages:', {
      totalStages: stages.length,
      stages: stages.map(s => ({ 
        title: s.title, 
        isWon: s.is_won, 
        isLost: s.is_lost,
        aiEnabled: s.ai_enabled 
      }))
    });

    // Filtrar para mostrar apenas etapas do funil principal (não GANHO nem PERDIDO)
    const mainFunnelStages = stages.filter(stage => !stage.is_won && !stage.is_lost);
    
    console.log('[useKanbanColumns] 📊 Etapas do funil principal:', {
      mainStagesCount: mainFunnelStages.length,
      mainStages: mainFunnelStages.map(s => s.title)
    });

    const newColumns: KanbanColumn[] = mainFunnelStages.map(stage => {
      const stageLeads = leads?.filter(lead => lead.columnId === stage.id) || [];
      
      console.log('[useKanbanColumns] 📋 Criando coluna:', {
        stageId: stage.id,
        stageTitle: stage.title,
        leadsCount: stageLeads.length,
        aiEnabled: stage.ai_enabled
      });
      
      return {
        id: stage.id,
        title: stage.title,
        leads: stageLeads,
        color: stage.color || "#e0e0e0",
        isFixed: stage.is_fixed || false,
        isHidden: false,
        ai_enabled: stage.ai_enabled === true // Garantir boolean correto, padrão false
      };
    });

    console.log('[useKanbanColumns] ✅ Colunas criadas:', {
      columnsCount: newColumns.length,
      columns: newColumns.map(c => ({ 
        id: c.id, 
        title: c.title, 
        leadsCount: c.leads.length,
        aiEnabled: c.ai_enabled 
      }))
    });

    return newColumns;
  }, [stages, leads, funnelId]); // Dependências estáveis

  // Função estável para atualizar colunas - memoizada para evitar recriações
  const setColumns = useMemo(() => {
    return (newColumns: KanbanColumn[] | ((prev: KanbanColumn[]) => KanbanColumn[])) => {
      console.log('[useKanbanColumns] 📝 Atualizando colunas:', typeof newColumns === 'function' ? 'função' : newColumns.length);
      // Esta função é principalmente para compatibilidade
      // A lógica real de atualização deve ser feita através dos hooks de stage management
    };
  }, []);

  return { columns, setColumns };
};
