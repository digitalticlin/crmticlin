
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { KanbanLead } from "@/types/kanban";
import { KanbanStage } from "@/types/funnel";

interface SalesFunnelActionsProps {
  stages: KanbanStage[];
  moveLeadToStage: (lead: KanbanLead, columnId: string, dealNote?: string, dealValue?: number) => void;
  refetchLeads: () => Promise<void>;
  refetchStages: () => Promise<void>;
  onStageModalOpen: (lead: KanbanLead) => void;
  onDealNoteModalOpen: (move: {lead: KanbanLead, status: "won" | "lost"}) => void;
}

export const SalesFunnelActions = ({
  stages,
  moveLeadToStage,
  refetchLeads,
  refetchStages,
  onStageModalOpen,
  onDealNoteModalOpen
}: SalesFunnelActionsProps) => {
  const navigate = useNavigate();

  const handleOpenChat = (lead: KanbanLead) => {
    navigate(`/whatsapp-chat?leadId=${lead.id}`);
  };

  const handleMoveToWonLost = async (lead: KanbanLead, status: "won" | "lost") => {
    onDealNoteModalOpen({ lead, status });
  };

  const handleReturnToFunnel = (lead: KanbanLead) => {
    onStageModalOpen(lead);
  };

  const handleStageSelection = async (lead: KanbanLead, stageId: string) => {
    await moveLeadToStage(lead, stageId);
    await refetchLeads();
    await refetchStages();
    toast.success("Lead retornado para o funil");
  };

  const handleDealNoteConfirm = async (note: string, pendingMove: {lead: KanbanLead, status: "won" | "lost"}) => {
    if (!pendingMove) return;

    const { lead, status } = pendingMove;
    const targetStage = stages?.find(stage => 
      status === "won" ? stage.is_won : stage.is_lost
    );
    
    if (targetStage) {
      // Para ganhos, o valor já foi atualizado no lead pelo SalesFunnelContent
      // Para perdas, usar o valor original do lead
      const dealValue = status === "won" ? lead.purchaseValue : lead.purchaseValue;
      
      await moveLeadToStage(lead, targetStage.id, note, dealValue);
      await refetchLeads();
      toast.success(`Lead movido para ${status === "won" ? "Ganhos" : "Perdidos"}`);
    }
  };

  return {
    handleOpenChat,
    handleMoveToWonLost,
    handleReturnToFunnel,
    handleStageSelection,
    handleDealNoteConfirm
  };
};
