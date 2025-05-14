
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
    <div className="flex h-screen bg-[#f5f5f5] dark:bg-[#121212] bg-gradient-to-br from-[#e0e0e0]/60 to-[#f5f5f5]/95 dark:from-[#121212]/80 dark:to-[#252525]/85 overflow-hidden font-playfair transition-soft">
      <Sidebar />

      <main className="flex-1 overflow-hidden">
        <div className="p-6 h-full flex flex-col glass dark:glass-dark rounded-2xl shadow-lg border-[2px] border-white/30 dark:border-white/10">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-playfair">Funil de Vendas</h1>
              <p className="text-muted-foreground font-sans mt-1">Gerencie seus leads e oportunidades de vendas</p>
            </div>
            <div className="flex gap-2">
              {activeTab === "won-lost" ? (
                <Button 
                  variant="outline"
                  className="rounded-2xl border shadow-md bg-white/30 hover:bg-white/80 transition-soft font-bold text-gray-900 dark:bg-white/10 dark:text-white"
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

          {/* Tabs para alternar funil/won-lost */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList className="glass dark:glass-dark rounded-2xl px-2 py-1 flex gap-2 border-transparent shadow-sm">
              <TabsTrigger value="funnel" className="transition-soft font-bold rounded-lg data-[state=active]:bg-ticlin/90 data-[state=active]:text-black data-[state=active]:shadow-md">Funil Principal</TabsTrigger>
              <TabsTrigger value="won-lost" className="transition-soft font-bold rounded-lg data-[state=active]:bg-ticlin/90 data-[state=active]:text-black data-[state=active]:shadow-md">Ganhos e Perdidos</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Board */}
          <div className="flex-1 overflow-hidden pt-2">
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
      
      {/* Lead Detail Sidebar */}
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

