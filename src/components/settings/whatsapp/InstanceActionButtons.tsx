
import { Button } from "@/components/ui/button";
import { QrCode, RefreshCw, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InstanceActionButtonsProps {
  connected: boolean;
  hasQrCode: boolean;
  isLoading: boolean;
  actionInProgress: boolean;
  onRefreshQrCode: () => Promise<void>;
  onConnect: () => Promise<void>;
  onDelete: () => Promise<void>;
}

const InstanceActionButtons = ({
  connected,
  hasQrCode,
  isLoading,
  actionInProgress,
  onRefreshQrCode,
  onConnect,
  onDelete
}: InstanceActionButtonsProps) => {
  return (
    <div className="flex gap-2">
      {!connected ? (
        /* Disconnected state buttons */
        <Button 
          variant="whatsapp" 
          className="flex-1"
          onClick={hasQrCode ? onRefreshQrCode : onConnect}
          disabled={isLoading || actionInProgress}
        >
          {hasQrCode ? (
            <>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || actionInProgress ? "animate-spin" : ""}`} />
              {isLoading || actionInProgress ? "Atualizando..." : "Atualizar QR Code"}
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              {isLoading || actionInProgress ? "Conectando..." : "Conectar WhatsApp"}
            </>
          )}
        </Button>
      ) : (
        /* Connected state buttons */
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={onDelete}
                disabled={isLoading || actionInProgress}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isLoading || actionInProgress ? "Desconectando..." : "Desconectar WhatsApp"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Esta ação irá remover o WhatsApp conectado</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default InstanceActionButtons;
