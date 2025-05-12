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
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Funil de Vendas</h1>
              <p className="text-muted-foreground">Gerencie seus leads e oportunidades de vendas</p>
            </div>
            
            <div className="flex gap-2">
              {activeTab === "won-lost" ? (
                <Button 
                  variant="outline" 
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
          
          {/* Tabs for switching between funnel and won/lost leads */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="funnel">Funil Principal</TabsTrigger>
              <TabsTrigger value="won-lost">Ganhos e Perdidos</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Main content area - adjusted to take up remaining height */}
          <div className="flex-1 overflow-hidden">
            {/* Kanban Board with conditional rendering based on active tab */}
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
      />
    </div>
  );
}
