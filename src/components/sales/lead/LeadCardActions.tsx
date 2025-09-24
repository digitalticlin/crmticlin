
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
  // Props validadas

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
      
      // Lead movido com sucesso
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
      <div className="lead-actions flex items-center space-x-1" data-no-drag>
        {onReturnToFunnel && (
          <div
            className="return-to-funnel-area p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 cursor-pointer"
            data-no-drag
            onClick={(e) => {
              // Deixar o evento subir para LeadCard detectar
            }}
            title="Retornar ao funil"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600 hover:text-blue-700" />
          </div>
        )}
      </div>
    );
  }

  // In funnel view, only show won/lost actions (stage control removed from here)
  const showWonButton = onMoveToWon && !isInWonStage && !isInLostStage;
  const showLostButton = onMoveToLost && !isInWonStage && !isInLostStage;

  // Condições dos botões validadas

  return (
    <div className="lead-actions flex items-center space-x-1" data-no-drag>
      {showWonButton && (
        <div
          className="won-button-area p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200 cursor-pointer"
          data-no-drag
          onClick={(e) => {
            // Deixar o evento subir para LeadCard detectar
          }}
          title="Marcar como ganho"
        >
          <CheckCircle className="h-4 w-4 text-green-600 hover:text-green-700" />
        </div>
      )}
      {showLostButton && (
        <div
          className="lost-button-area p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 cursor-pointer"
          data-no-drag
          onClick={(e) => {
            // Deixar o evento subir para LeadCard detectar
          }}
          title="Marcar como perdido"
        >
          <XCircle className="h-4 w-4 text-red-600 hover:text-red-700" />
        </div>
      )}
      {!showWonButton && !showLostButton && (
        <div className="text-xs text-gray-400 px-2">
          Sem ações
        </div>
      )}
    </div>
  );
};
