
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Adicionada a prop onlyDeleteMode
interface InstanceActionButtonsProps {
  connected: boolean;
  hasQrCode: boolean;
  isLoading: boolean;
  actionInProgress: boolean;
  onRefreshQrCode: () => Promise<void>;
  onConnect: () => Promise<void>;
  onDelete: () => Promise<void>;
  onlyDeleteMode?: boolean;
}

const InstanceActionButtons = ({
  connected,
  hasQrCode,
  isLoading,
  actionInProgress,
  onRefreshQrCode,
  onConnect,
  onDelete,
  onlyDeleteMode = false
}: InstanceActionButtonsProps) => {
  if (onlyDeleteMode) {
    // Modo restrito: mostra apenas o botão Deletar
    return (
      <div className="flex gap-2">
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
                {isLoading || actionInProgress ? "Removendo..." : "Deletar"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remover permanentemente esta instância da sua conta</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {!connected ? (
        /* Disconnected state buttons */
        <>
          {/* Botões removidos ("Atualizar QR Code"/"Conectar WhatsApp") */}
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
                  {isLoading || actionInProgress ? "Removendo..." : "Deletar"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remover permanentemente esta instância da sua conta</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
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

