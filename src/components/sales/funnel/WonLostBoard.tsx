import { useMemo } from "react";
import { KanbanBoard } from "../KanbanBoard";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";

interface WonLostBoardProps {
  stages: KanbanStage[];
  leads: KanbanLead[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onReturnToFunnel: (lead: KanbanLead) => void;
  wonStageId?: string;
  lostStageId?: string;
  searchTerm?: string;
  selectedTags?: string[];
  selectedUser?: string;
}

export const WonLostBoard = ({
  stages,
  leads,
  onOpenLeadDetail,
  onReturnToFunnel,
  wonStageId,
  lostStageId,
  searchTerm = "",
  selectedTags = [],
  selectedUser = ""
}: WonLostBoardProps) => {
  
  // Criar colunas filtradas para Won/Lost
  const wonLostColumns = useMemo(() => {
    if (!stages || !leads) return [];
    
    // Filtrar apenas stages ganho/perdido
    const wonLostStages = stages.filter(stage => stage.is_won || stage.is_lost);
    
    return wonLostStages.map(stage => {
      // Buscar leads dessa stage
      let stageLeads = leads.filter(lead => lead.columnId === stage.id);
      
      // Aplicar filtros de busca
      if (searchTerm) {
        stageLeads = stageLeads.filter(lead => 
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // TODO: Aplicar filtros de tags e usuário quando implementados
      
      return {
        id: stage.id,
        title: stage.title,
        leads: stageLeads,
        color: stage.is_won ? "#10b981" : "#ef4444", // Verde para ganho, vermelho para perdido
        isFixed: true,
        isHidden: false
      } as KanbanColumn;
    });
  }, [stages, leads, searchTerm, selectedTags, selectedUser]);

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
      onColumnsChange={() => {}} // Não permitir mudanças na aba won-lost
      onOpenLeadDetail={onOpenLeadDetail}
      onReturnToFunnel={onReturnToFunnel}
      isWonLostView={true}
      wonStageId={wonStageId}
      lostStageId={lostStageId}
    />
  );
};