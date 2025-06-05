
import { useState, useEffect } from "react";
import { KanbanColumn } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";

export const useKanbanColumns = (stages: KanbanStage[], leads: any[], funnelId?: string) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  // Converter stages e leads do banco para formato de colunas do Kanban
  // FILTRAR GANHO E PERDIDO do funil principal
  useEffect(() => {
    if (!stages.length || !funnelId) {
      setColumns([]);
      return;
    }

    const newColumns: KanbanColumn[] = stages
      .filter(stage => stage.title !== "GANHO" && stage.title !== "PERDIDO") // Filtrar as etapas
      .map(stage => {
        const stageLeads = leads.filter(lead => lead.columnId === stage.id);
        
        return {
          id: stage.id,
          title: stage.title,
          leads: stageLeads,
          color: stage.color || "#e0e0e0",
          isFixed: stage.is_fixed || false,
          isHidden: false
        };
      });

    setColumns(newColumns);
  }, [stages, leads, funnelId]);

  return { columns, setColumns };
};
