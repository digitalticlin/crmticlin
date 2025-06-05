
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { useRealSalesFunnel } from "@/hooks/salesFunnel/useRealSalesFunnel";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { toast } from "sonner";
import { FIXED_COLUMN_IDS, KanbanLead } from "@/types/kanban";
import { useNavigate } from "react-router-dom";
import { FunnelActionsBar } from "@/components/sales/funnel/FunnelActionsBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function SalesFunnelReal() {
  const [activeTab, setActiveTab] = useState("funnel");
  const navigate = useNavigate();
  
  const {
    columns,
    selectedLead,
    isLeadDetailOpen,
    setIsLeadDetailOpen,
    selectedFunnel,
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
    moveLeadToStage
  } = useRealSalesFunnel();

  // Função para abrir o chat com o lead selecionado
  const handleOpenChat = (lead: KanbanLead) => {
    navigate(`/whatsapp-chat?leadId=${lead.id}`);
  };

  const handleMoveToWonLost = async (lead: KanbanLead, status: "won" | "lost") => {
    const targetColumnId = status === "won" ? FIXED_COLUMN_IDS.WON : FIXED_COLUMN_IDS.LOST;
    
    // Encontrar o estágio correto baseado no is_won/is_lost
    const targetColumn = columns.find(col => 
      status === "won" ? col.title === "GANHO" : col.title === "PERDIDO"
    );
    
    if (targetColumn) {
      await moveLeadToStage(lead, targetColumn.id);
      toast.success(`Lead movido para ${status === "won" ? "Ganhos" : "Perdidos"}`);
    }
  };

  const returnLeadToFunnel = async (lead: KanbanLead) => {
    // Encontrar o primeiro estágio que não seja ganho/perdido
    const targetColumn = columns.find(col => col.title === "ENTRADA DE LEAD");
    
    if (targetColumn) {
      await moveLeadToStage(lead, targetColumn.id);
      toast.success("Lead retornado para o funil");
    }
  };

  const addLeadAction = (
    <Button 
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
      onClick={() => toast.info("Adicionar lead (em breve!)")}
    >
      <Plus className="h-4 w-4 mr-2" />
      Adicionar Lead
    </Button>
  );

  if (!selectedFunnel) {
    return (
      <PageLayout>
        <ModernPageHeader 
          title="Funil de Vendas" 
          description="Carregando funil..."
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando dados do funil...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ModernPageHeader 
        title="Funil de Vendas" 
        description={`Gerencie seus leads e oportunidades - ${selectedFunnel.name}`}
        action={addLeadAction}
      />

      <div className="mb-6">
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
      
      <div className="flex-1 w-full min-w-0 max-w-full flex flex-col items-center justify-center px-0 pt-0">
        <KanbanBoard
          columns={columns}
          onColumnsChange={() => {}} // Não usado mais - movimentação é feita via moveLeadToStage
          onOpenLeadDetail={openLeadDetail}
          onColumnUpdate={updateColumn}
          onColumnDelete={deleteColumn}
          onOpenChat={handleOpenChat}
          onMoveToWonLost={handleMoveToWonLost}
          onReturnToFunnel={returnLeadToFunnel}
        />
      </div>
      
      <LeadDetailSidebar
        isOpen={isLeadDetailOpen}
        onOpenChange={setIsLeadDetailOpen}
        selectedLead={selectedLead}
        availableTags={availableTags}
        onToggleTag={(tagId) => selectedLead && toggleTagOnLead(selectedLead.id, tagId)}
        onUpdateNotes={updateLeadNotes}
        onCreateTag={createTag}
        onUpdatePurchaseValue={updateLeadPurchaseValue}
        onUpdateAssignedUser={updateLeadAssignedUser}
        onUpdateName={updateLeadName}
      />
    </PageLayout>
  );
}
