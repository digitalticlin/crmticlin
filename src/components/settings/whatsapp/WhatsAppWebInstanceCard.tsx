
import { useState } from "react";
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);

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

  const handleSyncStatus = async () => {
    if (!onSyncStatus) return;
    
    setIsSyncing(true);
    try {
      console.log('[WhatsAppWebInstanceCard] Syncing status for instance:', instance.id);
      await onSyncStatus(instance.id);
    } catch (error) {
      console.error('[WhatsAppWebInstanceCard] Error syncing status:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceSync = async () => {
    if (!onForceSync) return;
    
    setIsForceSyncing(true);
    try {
      console.log('[WhatsAppWebInstanceCard] Force syncing instance:', instance.id);
      await onForceSync(instance.id);
    } catch (error) {
      console.error('[WhatsAppWebInstanceCard] Error force syncing:', error);
    } finally {
      setIsForceSyncing(false);
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

  const needsQRCode = ['waiting_scan', 'connecting', 'creating'].includes(instance.web_status || instance.connection_status);
  const canReconnect = instance.web_status === 'disconnected';
  const isConnected = ['ready', 'open'].includes(instance.web_status || instance.connection_status);
  const canSync = instance.vps_instance_id && !isConnected;

  // Detectar possível discrepância
  const hasDiscrepancy = instance.vps_instance_id && 
                        (!instance.phone || instance.phone === '') && 
                        ['connecting', 'waiting_scan'].includes(instance.web_status || instance.connection_status);

  console.log('[WhatsAppWebInstanceCard] Instance status check:', {
    id: instance.id,
    web_status: instance.web_status,
    connection_status: instance.connection_status,
    phone: instance.phone,
    needsQRCode,
    canReconnect,
    isConnected,
    canSync
  });

  return (
    <>
      <Card className={`relative ${isNewInstance ? 'ring-2 ring-green-400 ring-opacity-50' : ''} ${hasDiscrepancy ? 'border-orange-300' : ''}`}>
        <CardHeader className="pb-3">
          <InstanceCardHeader instance={instance} hasDiscrepancy={hasDiscrepancy} />
          <InstanceCardContent 
            instance={instance}
            isConnected={isConnected}
            needsQRCode={needsQRCode}
            hasDiscrepancy={hasDiscrepancy}
          />
        </CardHeader>

        <CardContent className="pt-0">
          <InstanceCardActions
            instance={instance}
            needsQRCode={needsQRCode}
            canReconnect={canReconnect}
            canSync={canSync}
            isRefreshing={isRefreshing}
            isSyncing={isSyncing}
            isForceSyncing={isForceSyncing}
            isDeleting={isDeleting}
            onShowQR={handleShowQR}
            onRefreshQR={handleRefreshQR}
            onSyncStatus={onSyncStatus ? handleSyncStatus : undefined}
            onForceSync={onForceSync ? handleForceSync : undefined}
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
