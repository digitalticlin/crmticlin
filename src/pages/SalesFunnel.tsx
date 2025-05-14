import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useSalesFunnel } from "@/hooks/useSalesFunnel";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { AddColumnDialog } from "@/components/sales/AddColumnDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { FIXED_COLUMN_IDS, KanbanLead } from "@/types/kanban";
import { useNavigate } from "react-router-dom";

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
    // Navigate to the chat page
    navigate('/chat');
  };

  // Function to move a lead to the won or lost column
  const moveLeadToStatus = (lead: KanbanLead, status: "won" | "lost") => {
    const targetColumnId = status === "won" ? FIXED_COLUMN_IDS.WON : FIXED_COLUMN_IDS.LOST;
    
    // Find and remove the lead from its current column
    const updatedColumns = columns.map(col => ({
      ...col,
      leads: col.leads.filter(l => l.id !== lead.id)
    }));
    
    // Add the lead to the target column with updated columnId
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

  // Function to return a lead from won/lost back to the funnel
  const returnLeadToFunnel = (lead: KanbanLead) => {
    // Remove lead from current column (won or lost)
    const updatedColumns = columns.map(col => ({
      ...col,
      leads: col.leads.filter(l => l.id !== lead.id)
    }));
    
    // Add lead to first non-hidden, non-fixed column or to NEW_LEAD column as fallback
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

  // Filter columns for won/lost view
  const wonLostColumns = columns.filter(col =>
    col.id === FIXED_COLUMN_IDS.WON || col.id === FIXED_COLUMN_IDS.LOST
  );

  return (
    <div
      className="flex h-screen overflow-hidden font-inter"
      style={{
        background: "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
      }}
    >
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ======================== DASHBOARD STYLE PAGE HEADER ======================== */}
        <div className="sticky top-0 z-30 w-full border-b border-slate-200/70 dark:border-white/10 bg-white dark:bg-[#232323] px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-center gap-2 transition-all">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-neutral-900 dark:text-white font-inter tracking-tight">
              Funil de Vendas
            </h1>
            <p className="text-base text-muted-foreground dark:text-zinc-300 font-inter">
              Gerencie seus leads e oportunidades de vendas
            </p>
          </div>
        </div>
        {/* =============== ETAPAS DO FUNIL: ABAS + ADICIONAR ETAPA ================ */}
        <div className="flex w-full flex-col gap-2 px-0 md:px-10 mt-6 mb-2">
          {/* Linha de botões de abas + Adicionar Etapa */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="shadow bg-white dark:bg-[#232323] border border-slate-200/70 dark:border-white/10 flex px-2 gap-2 rounded-full py-1">
                  <TabsTrigger
                    value="funnel"
                    className={`px-5 py-1.5 rounded-full font-medium font-inter text-sm md:text-base transition-all
                      ${activeTab === "funnel"
                        ? "bg-ticlin text-black shadow"
                        : "text-neutral-700 dark:text-white hover:bg-ticlin/10"}
                    `}
                  >
                    Funil Principal
                  </TabsTrigger>
                  <TabsTrigger
                    value="won-lost"
                    className={`px-5 py-1.5 rounded-full font-medium font-inter text-sm md:text-base transition-all
                      ${activeTab === "won-lost"
                        ? "bg-ticlin text-black shadow"
                        : "text-neutral-700 dark:text-white hover:bg-ticlin/10"}
                    `}
                  >
                    Ganhos e Perdidos
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {/* Botão Adicionar Etapa só aparece na aba principal */}
            {activeTab === "funnel" && (
              <AddColumnDialog onAddColumn={addColumn} />
            )}
          </div>
        </div>
        {/* =================== BOARD COM AS ETAPAS DO FUNIL ===================== */}
        <div className="flex-1 w-full min-w-0 max-w-full flex flex-col items-center justify-center px-0 md:px-10 pt-0">
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
      </main>
      {/* Sidebar de Detalhes */}
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
