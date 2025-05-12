
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";

interface LeadCardActionsProps {
  onMoveToWon?: () => void;
  onMoveToLost?: () => void;
  onReturnToFunnel?: () => void;
}

export const LeadCardActions = ({ onMoveToWon, onMoveToLost, onReturnToFunnel }: LeadCardActionsProps) => {
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
            onMoveToWon();
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
            onMoveToLost();
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
