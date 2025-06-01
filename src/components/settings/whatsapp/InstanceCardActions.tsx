
import { Button } from "@/components/ui/button";
import { QrCode, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface InstanceCardActionsProps {
  instance: WhatsAppWebInstance;
  needsQRCode: boolean;
  canReconnect: boolean;
  canSync: boolean;
  isRefreshing: boolean;
  isSyncing: boolean;
  isForceSyncing: boolean;
  isDeleting: boolean;
  onShowQR: () => void;
  onRefreshQR: () => Promise<void>;
  onSyncStatus?: () => Promise<void>;
  onForceSync?: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function InstanceCardActions({
  instance,
  needsQRCode,
  canReconnect,
  canSync,
  isRefreshing,
  isSyncing,
  isForceSyncing,
  isDeleting,
  onShowQR,
  onRefreshQR,
  onSyncStatus,
  onForceSync,
  onDelete
}: InstanceCardActionsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
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

      {canSync && onSyncStatus && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncStatus}
          disabled={isSyncing}
          className="flex-1"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Verificar Status'}
        </Button>
      )}

      {onForceSync && instance.vps_instance_id && (
        <Button
          variant="outline"
          size="sm"
          onClick={onForceSync}
          disabled={isForceSyncing}
          className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          <AlertTriangle className={`h-4 w-4 mr-1 ${isForceSyncing ? 'animate-spin' : ''}`} />
          {isForceSyncing ? 'Forçando...' : 'Forçar Sync'}
        </Button>
      )}

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
