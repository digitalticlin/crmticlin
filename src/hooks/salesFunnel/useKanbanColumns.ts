
import { useState, useEffect } from "react";
import { KanbanColumn } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";

export const useKanbanColumns = (stages: KanbanStage[], leads: any[], funnelId?: string) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  // Converter stages e leads do banco para formato de colunas do Kanban
  // MOSTRAR APENAS as etapas do funil principal (excluir GANHO e PERDIDO)
  useEffect(() => {
    if (!stages.length || !funnelId) {
      console.log('[useKanbanColumns] ⚠️ Sem stages ou funnelId:', { stagesCount: stages.length, funnelId });
      setColumns([]);
      return;
    }

    console.log('[useKanbanColumns] 🔍 Processando stages:', {
      totalStages: stages.length,
      stages: stages.map(s => ({ title: s.title, isWon: s.is_won, isLost: s.is_lost }))
    });

    // Filtrar para mostrar apenas etapas do funil principal (não GANHO nem PERDIDO)
    const mainFunnelStages = stages.filter(stage => !stage.is_won && !stage.is_lost);
    
    console.log('[useKanbanColumns] 📊 Etapas do funil principal:', {
      mainStagesCount: mainFunnelStages.length,
      mainStages: mainFunnelStages.map(s => s.title)
    });

    const newColumns: KanbanColumn[] = mainFunnelStages.map(stage => {
      const stageLeads = leads.filter(lead => lead.columnId === stage.id);
      
      console.log('[useKanbanColumns] 📋 Criando coluna:', {
        stageId: stage.id,
        stageTitle: stage.title,
        leadsCount: stageLeads.length
      });
      
      return {
        id: stage.id,
        title: stage.title,
        leads: stageLeads,
        color: stage.color || "#e0e0e0",
        isFixed: stage.is_fixed || false,
        isHidden: false
      };
    });

    console.log('[useKanbanColumns] ✅ Colunas criadas:', {
      columnsCount: newColumns.length,
      columns: newColumns.map(c => ({ id: c.id, title: c.title, leadsCount: c.leads.length }))
    });

    setColumns(newColumns);
  }, [stages, leads, funnelId]);

  return { columns, setColumns };
};
