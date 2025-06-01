
import { Button } from "@/components/ui/button";
import { QrCode, Trash2, RefreshCw } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface InstanceCardActionsProps {
  instance: WhatsAppWebInstance;
  needsQRCode: boolean;
  canReconnect: boolean;
  isRefreshing: boolean;
  isDeleting: boolean;
  onShowQR: () => void;
  onRefreshQR: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function InstanceCardActions({
  instance,
  needsQRCode,
  canReconnect,
  isRefreshing,
  isDeleting,
  onShowQR,
  onRefreshQR,
  onDelete
}: InstanceCardActionsProps) {
  const isConnecting = ['connecting', 'creating'].includes(instance.web_status || instance.connection_status);
  const isWaitingQR = instance.web_status === 'waiting_scan';

  // Durante a conexão, mostrar apenas informação, sem botões
  if (isConnecting && !isWaitingQR) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-sm text-muted-foreground">
          Conectando automaticamente...
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Botão QR Code apenas quando necessário */}
      {needsQRCode && (
        <Button
          variant="outline"
          size="sm"
          onClick={onShowQR}
          disabled={isRefreshing}
          className="flex-1"
        >
          <QrCode className="h-4 w-4 mr-1" />
          {isRefreshing ? 'Carregando...' : 'Ver QR Code'}
        </Button>
      )}
      
      {/* Botão Reconectar apenas quando desconectado */}
      {canReconnect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshQR}
          disabled={isRefreshing}
          className="flex-1"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          Reconectar
        </Button>
      )}

      {/* Botão Remover sempre disponível */}
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        {isDeleting ? 'Removendo...' : 'Remover'}
      </Button>
    </div>
  );
}
