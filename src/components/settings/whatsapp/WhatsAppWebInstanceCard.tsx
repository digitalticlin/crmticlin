
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { InstanceCardHeader } from "./InstanceCardHeader";
import { InstanceCardContent } from "./InstanceCardContent";
import { InstanceCardActions } from "./InstanceCardActions";
import { InstanceQRModal } from "./InstanceQRModal";

interface WhatsAppWebInstanceCardProps {
  instance: WhatsAppWebInstance;
  onDelete: (instanceId: string) => Promise<void>;
  onRefreshQR: (instanceId: string) => Promise<string>;
  onSyncStatus?: (instanceId: string) => Promise<any>;
  onForceSync?: (instanceId: string) => Promise<any>;
  onShowQR?: (instanceId: string) => void;
  isNewInstance?: boolean;
}

export function WhatsAppWebInstanceCard({ 
  instance, 
  onDelete, 
  onRefreshQR,
  onSyncStatus,
  onForceSync,
  onShowQR,
  isNewInstance = false
}: WhatsAppWebInstanceCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover esta instância?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete(instance.id);
    } catch (error) {
      console.error('[WhatsAppWebInstanceCard] Error deleting instance:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefreshQR = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshQR(instance.id);
      setShowQR(true);
    } catch (error) {
      console.error('[WhatsAppWebInstanceCard] Error refreshing QR:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShowQR = () => {
    console.log('[WhatsAppWebInstanceCard] Showing QR for instance:', instance.id, instance.web_status);
    if (onShowQR) {
      onShowQR(instance.id);
    } else {
      if (instance.qr_code) {
        setShowQR(true);
      } else {
        handleRefreshQR();
      }
    }
  };

  // Estados definidos de forma mais clara
  const needsQRCode = instance.web_status === 'waiting_scan';
  const canReconnect = instance.web_status === 'disconnected';
  const isConnected = ['ready', 'open'].includes(instance.web_status || instance.connection_status);
  const isConnecting = ['connecting', 'creating'].includes(instance.web_status || instance.connection_status);

  // Auto-sync para instâncias em estado de conexão
  useEffect(() => {
    if (!isConnecting || !onSyncStatus) return;

    console.log('[WhatsAppWebInstanceCard] Starting auto-sync for connecting instance:', instance.id);

    const syncInterval = setInterval(async () => {
      try {
        console.log('[WhatsAppWebInstanceCard] Auto-syncing instance:', instance.id);
        await onSyncStatus(instance.id);
      } catch (error) {
        console.error('[WhatsAppWebInstanceCard] Auto-sync error:', error);
      }
    }, 15000); // Auto-sync a cada 15 segundos

    // Cleanup após 5 minutos para evitar polling infinito
    const timeout = setTimeout(() => {
      clearInterval(syncInterval);
      console.log('[WhatsAppWebInstanceCard] Auto-sync timeout for instance:', instance.id);
    }, 300000); // 5 minutos

    return () => {
      clearInterval(syncInterval);
      clearTimeout(timeout);
    };
  }, [isConnecting, onSyncStatus, instance.id]);

  console.log('[WhatsAppWebInstanceCard] Instance status check:', {
    id: instance.id,
    web_status: instance.web_status,
    connection_status: instance.connection_status,
    phone: instance.phone,
    needsQRCode,
    canReconnect,
    isConnected,
    isConnecting
  });

  return (
    <>
      <Card className={`relative ${isNewInstance ? 'ring-2 ring-green-400 ring-opacity-50' : ''} ${isConnecting ? 'border-yellow-300 bg-yellow-50/30' : ''}`}>
        <CardHeader className="pb-3">
          <InstanceCardHeader instance={instance} />
          <InstanceCardContent 
            instance={instance}
            isConnected={isConnected}
            needsQRCode={needsQRCode}
          />
        </CardHeader>

        <CardContent className="pt-0">
          <InstanceCardActions
            instance={instance}
            needsQRCode={needsQRCode}
            canReconnect={canReconnect}
            isRefreshing={isRefreshing}
            isDeleting={isDeleting}
            onShowQR={handleShowQR}
            onRefreshQR={handleRefreshQR}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Dialog local para QR code quando não usar modal externo */}
      {!onShowQR && (
        <InstanceQRModal
          showQR={showQR}
          onOpenChange={setShowQR}
          instance={instance}
          isRefreshing={isRefreshing}
          onRefreshQR={handleRefreshQR}
        />
      )}
    </>
  );
}
