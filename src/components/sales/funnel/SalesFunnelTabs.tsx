import { useState, useMemo } from "react";
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

  // Validar dados de entrada
  const validatedStages = useMemo(() => Array.isArray(stages) ? stages : [], [stages]);
  const validatedLeads = useMemo(() => Array.isArray(leads) ? leads : [], [leads]);
  const validatedColumns = useMemo(() => Array.isArray(columns) ? columns : [], [columns]);

  // Buscar leads das etapas GANHO e PERDIDO para a aba won-lost
  const wonLostLeads = useMemo(() => {
    return validatedLeads.filter(lead => {
      const leadStage = validatedStages.find(stage => stage.id === lead.columnId);
      return leadStage && (leadStage.is_won || leadStage.is_lost);
    });
  }, [validatedLeads, validatedStages]);

  console.log('[SalesFunnelTabs] 📊 Estado atual:', {
    activeTab,
    totalStages: validatedStages.length,
    totalLeads: validatedLeads.length,
    wonLostLeads: wonLostLeads.length,
    columnsCount: validatedColumns.length,
    stages: validatedStages.map(s => ({ title: s.title, isWon: s.is_won, isLost: s.is_lost }))
  });

  // Criar colunas para aba won-lost (apenas GANHO e PERDIDO) com validação robusta
  const displayColumns = useMemo(() => {
    if (activeTab === "won-lost") {
      return validatedStages
        .filter(stage => stage.is_won || stage.is_lost)
        .map(stage => {
          // Buscar leads reais dessa stage
          const stageLeads = validatedLeads.filter(lead => lead.columnId === stage.id);
          
          console.log('[SalesFunnelTabs] 🏆 Criando coluna won-lost:', {
            stageTitle: stage.title,
            stageId: stage.id,
            leadsCount: stageLeads.length,
            isWon: stage.is_won,
            isLost: stage.is_lost
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
    }
    return validatedColumns;
  }, [activeTab, validatedStages, validatedLeads, validatedColumns]);

  console.log('[SalesFunnelTabs] 📋 Colunas a exibir:', {
    activeTab,
    displayColumnsCount: displayColumns.length,
    displayColumns: displayColumns.map(c => ({ title: c.title, leadsCount: c.leads.length }))
  });

  const handleColumnsChange = (newColumns: KanbanColumn[]) => {
    console.log('[SalesFunnelTabs] 🔄 Atualizando colunas:', newColumns.length);
    // Só atualizar se não estiver na aba won-lost
    if (activeTab !== "won-lost" && Array.isArray(newColumns)) {
      setColumns(newColumns);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Moderno */}
      <ModernFunnelHeader 
        selectedFunnel={selectedFunnel}
        totalLeads={validatedColumns.reduce((acc, col) => acc + (col.leads?.length || 0), 0)}
        wonLeads={wonLostLeads.filter(lead => {
          const leadStage = validatedStages.find(stage => stage.id === lead.columnId);
          return leadStage?.is_won;
        }).length}
        lostLeads={wonLostLeads.filter(lead => {
          const leadStage = validatedStages.find(stage => stage.id === lead.columnId);
          return leadStage?.is_lost;
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
      />
      
      {/* Board do Kanban - com validação completa */}
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
