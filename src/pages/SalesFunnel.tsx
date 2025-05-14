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
        {/* CABEÇALHO COM GLASS + BARRA DE FUNDO TRANSLÚCIDO */}
        <div className="sticky top-0 z-30 w-full flex flex-col gap-4 pb-2">
          <div className="backdrop-blur-md glass bg-white/60 dark:bg-[#232323cc] rounded-b-3xl shadow-glass-lg px-10 py-6 flex flex-col md:flex-row justify-between items-center border-b border-slate-200/15 dark:border-white/10 transition-all">
            <div className="flex flex-col items-center md:items-start">
              <h1 className="text-2xl md:text-3xl font-bold font-inter mb-1 text-neutral-900 dark:text-white tracking-tight">
                Funil de Vendas
              </h1>
              <p className="text-base font-inter font-medium text-muted-foreground dark:text-zinc-300">
                Gerencie seus leads e oportunidades de vendas
              </p>
            </div>
            <div className="mt-6 md:mt-0 flex gap-2">
              {activeTab === "won-lost" ? (
                <Button
                  variant="outline"
                  className="rounded-full bg-white/60 dark:bg-black/40 border-none shadow glass text-neutral-800 dark:text-white font-inter hover:ring-2 hover:ring-ticlin"
                  onClick={() => setActiveTab("funnel")}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar ao Funil
                </Button>
              ) : (
                <AddColumnDialog onAddColumn={addColumn} />
              )}
            </div>
          </div>
          {/* TABS reformuladas estilo "pill" glassmorphism */}
          <div className="flex w-full justify-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="shadow glass bg-white/50 dark:bg-[#232323b0] border-none flex px-2 gap-2 rounded-full py-1">
                <TabsTrigger
                  value="funnel"
                  className={`px-8 py-2 rounded-full font-semibold font-inter text-lg transition-all
                   ${activeTab==="funnel"
                    ? "bg-ticlin text-black shadow-md"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-ticlin/30"}
                  `}
                >
                  Funil Principal
                </TabsTrigger>
                <TabsTrigger
                  value="won-lost"
                  className={`px-8 py-2 rounded-full font-semibold font-inter text-lg transition-all
                   ${activeTab==="won-lost"
                    ? "bg-ticlin text-black shadow-md"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-ticlin/30"}
                  `}
                >
                  Ganhos e Perdidos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        {/* MAIN CONTENT COM BOARD CENTRALIZADO */}
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
