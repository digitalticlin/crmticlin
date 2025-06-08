
import { Button } from "@/components/ui/button";
import { QrCode, Trash2, Loader2 } from "lucide-react";
import { getStatusInfo } from "./InstanceStatusInfo";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface InstanceCardActionsProps {
  instance: WhatsAppWebInstance;
  isGeneratingQR: boolean;
  isDeleting: boolean;
  onGenerateQR: () => void;
  onDelete: () => void;
}

export const InstanceCardActions = ({
  instance,
  isGeneratingQR,
  isDeleting,
  onGenerateQR,
  onDelete
}: InstanceCardActionsProps) => {
  const statusInfo = getStatusInfo(instance);

  return (
    <div className="flex gap-3 pt-6">
      {(instance.connection_status !== 'connected' && instance.connection_status !== 'open') && (
        <Button
          onClick={onGenerateQR}
          disabled={isGeneratingQR}
          size="lg"
          className={`flex-1 h-12 text-white font-semibold rounded-xl shadow-lg 
            transition-all duration-200 hover:shadow-xl
            ${statusInfo.canRetry 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
        >
          {isGeneratingQR ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <QrCode className="h-5 w-5 mr-2" />
              Gerar QR Code
            </>
          )}
        </Button>
      )}
      
      <Button
        onClick={onDelete}
        disabled={isDeleting}
        variant="outline"
        size="lg"
        className="h-12 px-4 bg-white/20 backdrop-blur-sm border border-red-200/50 
          text-red-600 hover:bg-red-50/80 hover:border-red-300 rounded-xl
          transition-all duration-200"
      >
        {isDeleting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Trash2 className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};
