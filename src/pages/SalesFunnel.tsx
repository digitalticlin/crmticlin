
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden font-inter">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* HEADER (idêntico ao dashboard) */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold">Funil de Vendas</h1>
              <p className="text-muted-foreground">Gerencie seus leads e oportunidades de vendas</p>
            </div>
            {/* Aqui pode ir futuras ações do usuário caso precise */}
          </div>
          {/* SESSÃO DAS ETAPAS DO FUNIL + BOTÃO ADICIONAR ETAPA E ABAS */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="shadow bg-white dark:bg-[#232323] border border-slate-200/70 dark:border-white/10 flex px-2 gap-2 rounded-full py-1">
                  <TabsTrigger
                    value="funnel"
                    className={`px-4 py-1 rounded-full font-medium font-inter text-xs md:text-sm transition-all
                      ${activeTab === "funnel"
                        ? "bg-ticlin text-black shadow"
                        : "text-neutral-700 dark:text-white hover:bg-ticlin/10"}
                    `}
                  >
                    Funil Principal
                  </TabsTrigger>
                  <TabsTrigger
                    value="won-lost"
                    className={`px-4 py-1 rounded-full font-medium font-inter text-xs md:text-sm transition-all
                      ${activeTab === "won-lost"
                        ? "bg-ticlin text-black shadow"
                        : "text-neutral-700 dark:text-white hover:bg-ticlin/10"}
                    `}
                  >
                    Ganhos e Perdidos
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {/* Botão Adicionar Etapa só aparece na aba principal */}
              {activeTab === "funnel" && (
                <div>
                  <AddColumnDialog onAddColumn={addColumn} />
                </div>
              )}
            </div>
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
