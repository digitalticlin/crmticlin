
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeadCardActionsProps {
  leadId?: string;
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
  onReturnToFunnel?: () => void;
  wonStageId?: string;
  lostStageId?: string;
}

export const LeadCardActions = ({ 
  leadId,
  onMoveToWon, 
  onMoveToLost, 
  onReturnToFunnel,
  wonStageId,
  lostStageId
}: LeadCardActionsProps) => {
  const moveLeadToStage = async (stageId: string, statusText: string) => {
    if (!leadId || !stageId) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ kanban_stage_id: stageId })
        .eq("id", leadId);

      if (error) throw error;
      
      toast.success(`Lead marcado como ${statusText}!`);
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

  if (!onMoveToWon && !onMoveToLost && !onReturnToFunnel) {
    return null;
  }
  
  return (
    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
      {onReturnToFunnel && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onReturnToFunnel();
          }}
          title="Retornar ao funil"
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-4 w-4 text-blue-500" />
        </button>
      )}
      {onMoveToWon && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleMoveToWon();
          }}
          title="Marcar como ganho"
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <CheckCircle className="h-4 w-4 text-green-500" />
        </button>
      )}
      {onMoveToLost && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleMoveToLost();
          }}
          title="Marcar como perdido"
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <XCircle className="h-4 w-4 text-red-500" />
        </button>
      )}
    </div>
  );
};
