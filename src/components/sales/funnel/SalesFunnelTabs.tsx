
import { useState } from "react";
import { ModernFunnelHeader } from "./ModernFunnelHeader";
import { ModernFunnelControlBar } from "./ModernFunnelControlBar";
import { KanbanBoard } from "../KanbanBoard";
import { KanbanColumn, KanbanLead } from "@/types/kanban";
import { Funnel, KanbanStage } from "@/types/funnel";
import { KanbanTag } from "@/types/kanban";

interface SalesFunnelTabsProps {
  funnels: Funnel[];
  selectedFunnel: Funnel;
  setSelectedFunnel: (funnel: Funnel) => void;
  createFunnel: (name: string, description?: string) => Promise<void>;
  columns: KanbanColumn[];
  setColumns: (columns: KanbanColumn[]) => void;
  stages: KanbanStage[];
  leads: KanbanLead[];
  availableTags: KanbanTag[];
  wonStageId?: string;
  lostStageId?: string;
  isAdmin: boolean;
  addColumn: (title: string) => void;
  updateColumn: (column: KanbanColumn) => void;
  deleteColumn: (columnId: string) => void;
  openLeadDetail: (lead: KanbanLead) => void;
  onOpenChat: (lead: KanbanLead) => void;
  onMoveToWonLost: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel: (lead: KanbanLead) => void;
  wonLostFilters?: any;
}

export const SalesFunnelTabs = ({
  funnels,
  selectedFunnel,
  setSelectedFunnel,
  createFunnel,
  columns,
  setColumns,
  stages,
  leads,
  availableTags,
  wonStageId,
  lostStageId,
  isAdmin,
  addColumn,
  updateColumn,
  deleteColumn,
  openLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  wonLostFilters
}: SalesFunnelTabsProps) => {
  const [activeTab, setActiveTab] = useState("funnel");

  // Buscar leads das etapas GANHO e PERDIDO diretamente dos leads totais
  const wonLostLeads = leads?.filter(lead => {
    const leadStage = stages?.find(stage => stage.id === lead.columnId);
    return leadStage && (leadStage.title === "GANHO" || leadStage.title === "PERDIDO");
  }) || [];

  // Filtrar colunas para mostrar apenas Ganhos e Perdidos na aba won-lost
  const displayColumns = activeTab === "won-lost" 
    ? stages
        ?.filter(stage => stage.title === "GANHO" || stage.title === "PERDIDO")
        .map(stage => {
          // Buscar leads reais dessa stage diretamente dos leads totais
          const stageLeads = leads?.filter(lead => lead.columnId === stage.id) || [];
          
          return {
            id: stage.id,
            title: stage.title,
            leads: stageLeads,
            color: stage.color || "#e0e0e0",
            isFixed: stage.is_fixed || false,
            isHidden: false
          };
        }) || []
    : columns;

  const handleColumnsChange = (newColumns: any[]) => {
    console.log("Aplicando atualização otimista das colunas:", newColumns);
    setColumns(newColumns);
  };

  return (
    <div className="space-y-6">
      {/* Header Moderno */}
      <ModernFunnelHeader 
        selectedFunnel={selectedFunnel}
        totalLeads={columns.reduce((acc, col) => acc + col.leads.length, 0)}
        wonLeads={wonLostLeads.filter(lead => {
          const leadStage = stages?.find(stage => stage.id === lead.columnId);
          return leadStage?.title === "GANHO";
        }).length}
        lostLeads={wonLostLeads.filter(lead => {
          const leadStage = stages?.find(stage => stage.id === lead.columnId);
          return leadStage?.title === "PERDIDO";
        }).length}
        activeTab={activeTab}
      />

      {/* Barra de Controles Moderna */}
      <ModernFunnelControlBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddColumn={() => addColumn("Nova etapa")}
        onManageTags={() => {}}
        onAddLead={() => {}}
        funnels={funnels}
        selectedFunnel={selectedFunnel}
        onSelectFunnel={setSelectedFunnel}
        onCreateFunnel={createFunnel}
        isAdmin={isAdmin}
        wonLostFilters={activeTab === "won-lost" ? wonLostFilters : undefined}
      />
      
      {/* Board do Kanban - com atualização otimista */}
      <KanbanBoard
        columns={displayColumns}
        onColumnsChange={handleColumnsChange}
        onOpenLeadDetail={openLeadDetail}
        onColumnUpdate={activeTab === "funnel" ? updateColumn : undefined}
        onColumnDelete={activeTab === "funnel" ? deleteColumn : undefined}
        onOpenChat={onOpenChat}
        onMoveToWonLost={onMoveToWonLost}
        onReturnToFunnel={onReturnToFunnel}
        isWonLostView={activeTab === "won-lost"}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
      />
    </div>
  );
};
