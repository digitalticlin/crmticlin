
import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ModernPageHeader } from "@/components/layout/ModernPageHeader";
import { useRealSalesFunnel } from "@/hooks/salesFunnel/useRealSalesFunnel";
import { useNewLeadIntegration } from "@/hooks/salesFunnel/useNewLeadIntegration";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { toast } from "sonner";
import { KanbanLead } from "@/types/kanban";
import { useNavigate } from "react-router-dom";
import { FunnelActionsBar } from "@/components/sales/funnel/FunnelActionsBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserRole } from "@/hooks/useUserRole";

export default function SalesFunnel() {
  const [activeTab, setActiveTab] = useState("funnel");
  const navigate = useNavigate();
  const { companyId } = useCompanyData();
  const { isAdmin } = useUserRole();
  
  // Gerenciamento de múltiplos funis
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    loading: funnelLoading
  } = useFunnelManagement(companyId);

  const {
    columns,
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
    moveLeadToStage
  } = useRealSalesFunnel(selectedFunnel?.id);

  // Integração com novos leads do chat
  useNewLeadIntegration(selectedFunnel?.id);

  // Função para abrir o chat com o lead selecionado
  const handleOpenChat = (lead: KanbanLead) => {
    navigate(`/whatsapp-chat?leadId=${lead.id}`);
  };

  const handleMoveToWonLost = async (lead: KanbanLead, status: "won" | "lost") => {
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

  // Wrapper para createFunnel que não retorna nada
  const handleCreateFunnel = async (name: string, description?: string): Promise<void> => {
    await createFunnel(name, description);
  };

  const addLeadAction = (
    <Button 
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 font-medium shadow-lg transition-all duration-200 hover:shadow-xl"
      onClick={() => toast.info("Adicionar lead manualmente (em breve!)")}
    >
      <Plus className="h-4 w-4 mr-2" />
      Adicionar Lead
    </Button>
  );

  if (funnelLoading) {
    return (
      <PageLayout>
        <ModernPageHeader 
          title="Funil de Vendas" 
          description="Carregando funis..."
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando dados dos funis...</p>
        </div>
      </PageLayout>
    );
  }

  if (!selectedFunnel) {
    return (
      <PageLayout>
        <ModernPageHeader 
          title="Funil de Vendas" 
          description="Nenhum funil encontrado"
          action={isAdmin ? addLeadAction : undefined}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              {isAdmin ? "Nenhum funil encontrado. Crie seu primeiro funil para começar." : "Nenhum funil disponível para você."}
            </p>
            {isAdmin && (
              <Button onClick={() => handleCreateFunnel("Funil Principal", "Funil principal de vendas")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Funil
              </Button>
            )}
          </div>
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
          onAddLead={() => toast.info("Adicionar lead (em breve!)")}
          funnels={funnels}
          selectedFunnel={selectedFunnel}
          onSelectFunnel={setSelectedFunnel}
          onCreateFunnel={handleCreateFunnel}
          isAdmin={isAdmin}
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
