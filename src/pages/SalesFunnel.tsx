import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useSalesFunnel } from "@/hooks/useSalesFunnel";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { AddColumnDialog } from "@/components/sales/AddColumnDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Tag, Plus, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { FIXED_COLUMN_IDS, KanbanLead } from "@/types/kanban";
import { useNavigate } from "react-router-dom";

// Novos controles
import { FunnelActionsBar } from "@/components/sales/funnel/FunnelActionsBar";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useStageManagement } from "@/hooks/salesFunnel/useStageManagement";
import { useTagDatabase } from "@/hooks/salesFunnel/useTagDatabase";
import { FunnelSelector } from "@/components/sales/funnel/FunnelSelector";
import { useCompanyData } from "@/hooks/useCompanyData";

export default function SalesFunnel() {
  const [activeTab, setActiveTab] = useState("funnel");
  const navigate = useNavigate();
  const {
    columns,
    setColumns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    availableTags,
    addColumn,
    updateColumn,
    deleteColumn,
    openLeadDetail,
    toggleTagOnLead,
    createTag,
    updateLeadNotes,
    updateLeadPurchaseValue,
    updateLeadAssignedUser,
    updateLeadName,
    receiveNewLead
  } = useSalesFunnel();

  const handleOpenChat = (lead: KanbanLead) => {
    navigate('/chat');
  };

  const moveLeadToStatus = (lead: KanbanLead, status: "won" | "lost") => {
    const targetColumnId = status === "won" ? FIXED_COLUMN_IDS.WON : FIXED_COLUMN_IDS.LOST;
    const updatedColumns = columns.map(col => ({
      ...col,
      leads: col.leads.filter(l => l.id !== lead.id)
    }));
    const finalColumns = updatedColumns.map(col => {
      if (col.id === targetColumnId) {
        return {
          ...col,
          leads: [{...lead, columnId: targetColumnId}, ...col.leads]
        };
      }
      return col;
    });
    setColumns(finalColumns);
    toast.success(`Lead movido para ${status === "won" ? "Ganhos" : "Perdidos"}`);
  };

  const returnLeadToFunnel = (lead: KanbanLead) => {
    const updatedColumns = columns.map(col => ({
      ...col,
      leads: col.leads.filter(l => l.id !== lead.id)
    }));
    const targetColumn = columns.find(col => !col.isHidden && !col.isFixed) || 
                         columns.find(col => col.id === FIXED_COLUMN_IDS.NEW_LEAD);
    if (!targetColumn) {
      toast.error("Não foi possível mover o lead de volta para o funil");
      return;
    }
    const finalColumns = updatedColumns.map(col => {
      if (col.id === targetColumn.id) {
        return {
          ...col,
          leads: [{...lead, columnId: targetColumn.id}, ...col.leads]
        };
      }
      return col;
    });
    setColumns(finalColumns);
    toast.success("Lead retornado para o funil");
  };

  const wonLostColumns = columns.filter(col =>
    col.id === FIXED_COLUMN_IDS.WON || col.id === FIXED_COLUMN_IDS.LOST
  );

  const { company } = useCompanyData();
  // Multi-funil hook
  const { funnels, selectedFunnel, setSelectedFunnel, createFunnel, loadFunnels } =
    useFunnelManagement(company?.id);

  // Etapas por funil (7 como limite)
  const { stages, addStage, loadStages } = useStageManagement(selectedFunnel?.id, 7);

  // Persistência etiquetas
  const { tags, createTag: createTagDb, loadTags } = useTagDatabase(company?.id);

  // Adicionar funil e etapas fixas iniciais se não existirem
  // ... implement you want: check onCreateFunnel if necessary

  // Atualizar o estado de leads, etc com funnel_id, kanban_stage_id

  // Adapte os controles inferiores para filtrar boards, etapas e cartões pelo funil selecionado

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold">Funil de Vendas</h1>
              <p className="text-muted-foreground">Gerencie seus leads e oportunidades de vendas</p>
            </div>
          </div>

          {/* SESSÃO DAS ETAPAS E AÇÕES */}
          <div className="mb-8">
            <FunnelActionsBar 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onAddColumn={() => addColumn("Nova etapa")}
              onManageTags={() => toast.info("Gerenciar etiquetas (em breve!)")}
              onCreateNewFunnel={() => toast.info("Criar novo funil (em breve!)")}
              onSwitchFunnel={() => toast.info("Alternar entre funis (em breve!)")}
              onAddLead={() => toast.info("Adicionar lead (em breve!)")}
            />
          </div>
          
          {/* BOARD DO FUNIL */}
          <div className="flex-1 w-full min-w-0 max-w-full flex flex-col items-center justify-center px-0 pt-0">
            {activeTab === "funnel" ? (
              <KanbanBoard
                columns={columns}
                onColumnsChange={setColumns}
                onOpenLeadDetail={openLeadDetail}
                onColumnUpdate={updateColumn}
                onColumnDelete={deleteColumn}
                onOpenChat={handleOpenChat}
                onMoveToWonLost={moveLeadToStatus}
              />
            ) : (
              <KanbanBoard
                columns={wonLostColumns}
                onColumnsChange={setColumns}
                onOpenLeadDetail={openLeadDetail}
                onColumnUpdate={updateColumn}
                onColumnDelete={deleteColumn}
                onOpenChat={handleOpenChat}
                onReturnToFunnel={returnLeadToFunnel}
                isWonLostView={true}
              />
            )}
          </div>
        </div>
      </main>
      <LeadDetailSidebar
        isOpen={isLeadDetailOpen}
        onOpenChange={setIsLeadDetailOpen}
        selectedLead={selectedLead}
        availableTags={availableTags}
        onToggleTag={toggleTagOnLead}
        onUpdateNotes={updateLeadNotes}
        onCreateTag={createTag}
        onUpdatePurchaseValue={updateLeadPurchaseValue}
        onUpdateAssignedUser={updateLeadAssignedUser}
        onUpdateName={updateLeadName}
      />
    </div>
  );
}
