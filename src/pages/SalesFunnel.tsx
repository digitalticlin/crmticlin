import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSalesFunnel } from "@/hooks/salesFunnel/useSalesFunnel";
import { KanbanBoard } from "@/components/sales/KanbanBoard";
import { LeadDetailSidebar } from "@/components/sales/LeadDetailSidebar";
import { toast } from "sonner";
import { FIXED_COLUMN_IDS, KanbanLead } from "@/types/kanban";
import { useNavigate } from "react-router-dom";
import { FunnelActionsBar } from "@/components/sales/funnel/FunnelActionsBar";
import { useFunnelManagement } from "@/hooks/salesFunnel/useFunnelManagement";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useLeadsDatabase } from "@/hooks/salesFunnel/useLeadsDatabase";
import { useStageDatabase } from "@/hooks/salesFunnel/useStageDatabase";
import { useTagDatabase } from "@/hooks/salesFunnel/useTagDatabase";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
    receiveNewLead,
    moveLeadToStage
  } = useSalesFunnel();

  const handleOpenChat = (lead: KanbanLead) => {
    navigate('/chat');
  };

  const handleMoveToWonLost = async (lead: KanbanLead, status: "won" | "lost") => {
    const targetColumnId = status === "won" ? FIXED_COLUMN_IDS.WON : FIXED_COLUMN_IDS.LOST;
    const { companyId } = useCompanyData();
    const { funnels, selectedFunnel } = useFunnelManagement(companyId);
    if (!selectedFunnel) {
      toast.error("Funil não selecionado.");
      return;
    }
    await moveLeadToStage(lead, targetColumnId, selectedFunnel.id);
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

  const { companyId } = useCompanyData();
  const { funnels, selectedFunnel, setSelectedFunnel, createFunnel, loadFunnels } =
    useFunnelManagement(companyId);

  const { stages, refetchStages } = useStageDatabase(selectedFunnel?.id);
  const { leads, refetchLeads, updateLead, addTagToLead, removeTagFromLead } = useLeadsDatabase(selectedFunnel?.id);

  const handleUpdateLead = async (leadId: string, fields: Partial<KanbanLead>) => {
    await updateLead({ leadId, fields });
    refetchLeads();
  };

  const handleToggleTag = async (leadId: string, tagId: string, hasTag: boolean) => {
    if (hasTag) {
      await removeTagFromLead({ leadId, tagId });
    } else {
      await addTagToLead({ leadId, tagId });
    }
    refetchLeads();
  };

  const { tags, createTag: createTagDb, loadTags } = useTagDatabase(companyId);

  const addLeadAction = (
    <Button 
      onClick={() => toast.info("Adicionar lead (em breve!)")}
    >
      <Plus className="h-4 w-4 mr-2" />
      Adicionar Lead
    </Button>
  );

  return (
    <PageLayout>
      <PageHeader 
        title="Funil de Vendas" 
        description="Gerencie seus leads e oportunidades de vendas"
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
          onColumnsChange={setColumns}
          onOpenLeadDetail={openLeadDetail}
          onColumnUpdate={updateColumn}
          onColumnDelete={deleteColumn}
          onOpenChat={handleOpenChat}
          onMoveToWonLost={handleMoveToWonLost}
        />
      </div>
      
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
    </PageLayout>
  );
}
