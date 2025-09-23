
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// Removido provider - usando props diretas

interface LeadCardActionsProps {
  leadId?: string;
  leadColumnId?: string;
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
  onReturnToFunnel?: () => void;
  wonStageId?: string;
  lostStageId?: string;
  isWonLostView?: boolean;
}

export const LeadCardActions = ({
  leadId,
  leadColumnId,
  onMoveToWon,
  onMoveToLost,
  onReturnToFunnel,
  wonStageId,
  lostStageId,
  isWonLostView = false
}: LeadCardActionsProps) => {
  // DEBUG: Verificar se IDs estão chegando
  console.log('[LeadCardActions] 🎯 Props recebidas:', {
    leadId,
    leadColumnId,
    wonStageId,
    lostStageId,
    hasOnMoveToWon: !!onMoveToWon,
    hasOnMoveToLost: !!onMoveToLost,
    isWonLostView
  });

  // Usando callbacks das props - removido contexto

  const moveLeadToStage = async (stageId: string, statusText: string) => {
    if (!leadId || !stageId) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ kanban_stage_id: stageId })
        .eq("id", leadId);

      if (error) throw error;
      
      toast.success(`Lead marcado como ${statusText}!`);
      
      // Real-time subscriptions atualizam automaticamente
      // Não precisa de refresh manual
      
      console.log(`Lead ${leadId} movido para estágio ${stageId}`);
    } catch (error) {
      console.error(`Erro ao mover lead para ${statusText}:`, error);
      toast.error(`Erro ao marcar como ${statusText}`);
    }
  };

  const handleMoveToWon = async () => {
    if (wonStageId) {
      await moveLeadToStage(wonStageId, "ganho");
    }
    onMoveToWon?.();
  };

  const handleMoveToLost = async () => {
    if (lostStageId) {
      await moveLeadToStage(lostStageId, "perdido");
    }
    onMoveToLost?.();
  };

  // Check if lead is already in won or lost stage
  const isInWonStage = leadColumnId === wonStageId;
  const isInLostStage = leadColumnId === lostStageId;

  // In won/lost view, only show return to funnel button
  if (isWonLostView) {
    return (
      <div className="lead-actions flex items-center space-x-1" data-no-drag onClick={(e) => e.stopPropagation()}>
        {onReturnToFunnel && (
          <button
            data-no-drag
            onClick={(e) => {
              e.stopPropagation();
              onReturnToFunnel();
            }}
            title="Retornar ao funil"
            className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600 hover:text-blue-700" />
          </button>
        )}
      </div>
    );
  }

  // In funnel view, only show won/lost actions (stage control removed from here)
  const showWonButton = onMoveToWon && !isInWonStage && !isInLostStage;
  const showLostButton = onMoveToLost && !isInWonStage && !isInLostStage;

  console.log('[LeadCardActions] 🎮 Condições dos botões:', {
    showWonButton,
    showLostButton,
    isInWonStage,
    isInLostStage,
    wonStageId,
    lostStageId,
    leadColumnId
  });

  return (
    <div className="lead-actions flex items-center space-x-1" data-no-drag onClick={(e) => e.stopPropagation()}>
      {showWonButton && (
        <button
          data-no-drag
          onClick={(e) => {
            e.stopPropagation();
            handleMoveToWon();
          }}
          title="Marcar como ganho"
          className="p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
        >
          <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-700" />
        </button>
      )}
      {showLostButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleMoveToLost();
          }}
          title="Marcar como perdido"
          className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
        >
          <XCircle className="h-4 w-4 text-red-600 hover:text-red-700" />
        </button>
      )}
      {!showWonButton && !showLostButton && (
        <div className="text-xs text-gray-400 px-2">
          Sem ações
        </div>
      )}
    </div>
  );
};
