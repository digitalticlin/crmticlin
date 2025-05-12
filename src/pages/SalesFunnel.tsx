
import Sidebar from "@/components/layout/Sidebar";
import { useSalesFunnel } from "@/hooks/useSalesFunnel";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { AddColumnDialog } from "@/components/sales/AddColumnDialog";

export default function SalesFunnel() {
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
    updateLeadNotes,
  } = useSalesFunnel();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Funil de Vendas</h1>
              <p className="text-muted-foreground">Gerencie seus leads e oportunidades de vendas</p>
            </div>
            
            <AddColumnDialog onAddColumn={addColumn} />
          </div>
          
          {/* Kanban Board */}
          <KanbanBoard 
            columns={columns}
            onColumnsChange={setColumns}
            onOpenLeadDetail={openLeadDetail}
            onColumnUpdate={updateColumn}
            onColumnDelete={deleteColumn}
          />
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
      />
    </div>
  );
}
