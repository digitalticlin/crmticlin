import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";
import InstanceHeader from "./InstanceHeader";
import DeviceInfoSection from "./DeviceInfoSection";
import QrCodeSection from "./QrCodeSection";
import InstanceActionButtons from "./InstanceActionButtons";
import { useConnectionSynchronizer } from "@/hooks/whatsapp/status-monitor/useConnectionSynchronizer";

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  isLoading: boolean;
  showQrCode: boolean;
  onConnect: (instanceId: string) => Promise<void>;
  onDelete: (instanceId: string) => Promise<void>;
  onRefreshQrCode: (instanceId: string) => Promise<void>;
  onStatusCheck?: (instanceId: string) => void;
}

const WhatsAppInstanceCard = ({
  instance,
  isLoading,
  showQrCode,
  onConnect,
  onDelete,
  onRefreshQrCode,
  onStatusCheck
}: WhatsAppInstanceCardProps) => {
  // Local state to track when QR code was successfully obtained
  const [qrCodeSuccess, setQrCodeSuccess] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // Get connection synchronizer for manual refresh
  const { forceSyncConnectionStatus, isSyncing } = useConnectionSynchronizer();

  // Detect when a QR code is received to show automatically
  useEffect(() => {
    if (instance.qrCodeUrl && !qrCodeSuccess) {
      console.log(`QR Code received for instance ${instance.id}: ${instance.instanceName}`);
      setQrCodeSuccess(true);
      
      // Start frequent status checks when QR code is shown
      if (onStatusCheck) {
        onStatusCheck(instance.id);
      }
      
      // Set up more frequent status checks while QR code is showing
      const statusCheckInterval = setInterval(() => {
        if (onStatusCheck) {
          onStatusCheck(instance.id);
        }
      }, 2000);
      
      // Clear interval if component unmounts or status changes to connected
      return () => {
        clearInterval(statusCheckInterval);
      };
    }
  }, [instance.qrCodeUrl, qrCodeSuccess, instance.id, instance.instanceName, onStatusCheck]);

  // Stop frequent checking when instance gets connected
  useEffect(() => {
    if (instance.connected) {
      setQrCodeSuccess(false); // Reset QR code success state
    }
  }, [instance.connected]);
  
  // Periodically sync status if QR code is showing
  useEffect(() => {
    if (showQrCode || qrCodeSuccess) {
      const syncInterval = setInterval(() => {
        forceSyncConnectionStatus(instance.id, instance.instanceName);
      }, 5000); // Check every 5 seconds while QR is showing
      
      return () => clearInterval(syncInterval);
    }
  }, [showQrCode, qrCodeSuccess, instance.id, instance.instanceName, forceSyncConnectionStatus]);

  // Removido: useEffect que faz polling via interval próprio quando QRCode está sendo exibido
  // Vamos confiar APENAS no periodic checker central já corrigido
  // O único check imediato permitido é um status manual (usuário clica); status ao montar o QR code/dispositivo é centralizado.

  // Click function to connect WhatsApp
  const handleConnect = async () => {
    try {
      console.log(`Starting connection for instance ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      setQrCodeSuccess(false);
      await onConnect(instance.id);
      console.log(`Connection started for ${instance.instanceName}`);
      
      // After connecting, force a status sync
      await forceSyncConnectionStatus(instance.id, instance.instanceName);
      
      // Trigger more frequent status checks after connection is initiated
      if (onStatusCheck) {
        onStatusCheck(instance.id);
      }
    } catch (error) {
      console.error("Error connecting:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Function to update QR code
  const handleRefreshQrCode = async () => {
    try {
      console.log(`Updating QR code for instance ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      setQrCodeSuccess(false);
      await onRefreshQrCode(instance.id);
      console.log(`QR code updated for ${instance.instanceName}`);
      
      // After refreshing QR, force a status sync
      await forceSyncConnectionStatus(instance.id, instance.instanceName);
      
      // Trigger more frequent status checks after QR code refresh
      if (onStatusCheck) {
        onStatusCheck(instance.id);
      }
    } catch (error) {
      console.error("Error updating QR code:", error);
    } finally {
      setActionInProgress(false);
    }
  };
  
  // Function to manually refresh connection status
  const handleStatusRefresh = async () => {
    try {
      console.log(`Manually refreshing status for ${instance.instanceName}`);
      await forceSyncConnectionStatus(instance.id, instance.instanceName);
    } catch (error) {
      console.error("Error refreshing status:", error);
    }
  };

  // Function to delete WhatsApp number
  const handleDelete = async () => {
    try {
      console.log(`Deleting instance ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      await onDelete(instance.id);
      console.log(`Instance ${instance.instanceName} deleted`);
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Determine if QR code should be shown (when available and shown)
  const shouldShowQrCode = (showQrCode || qrCodeSuccess) && instance.qrCodeUrl;
  
  // Determine if we're currently loading status
  const isStatusLoading = isLoading || isSyncing[instance.id];

  return (
    <Card className="overflow-hidden glass-card border-0">
      <CardContent className="p-0">
        <div className="p-4">
          {/* Header section - always visible */}
          <InstanceHeader 
            instance={instance} 
            onRefreshStatus={handleStatusRefresh}
            isStatusLoading={isStatusLoading}
          />
          
          {/* Connected Section - Only shown when connected */}
          {instance.connected && (
            <DeviceInfoSection deviceInfo={instance.deviceInfo} />
          )}
          
          {/* QR Code Section - Only shown when disconnected and QR code exists */}
          {shouldShowQrCode && instance.qrCodeUrl && !instance.connected && (
            <QrCodeSection qrCodeUrl={instance.qrCodeUrl} />
          )}
          
          {/* Action Buttons - Different based on connection state */}
          <InstanceActionButtons
            connected={instance.connected}
            hasQrCode={!!instance.qrCodeUrl}
            isLoading={isLoading}
            actionInProgress={actionInProgress}
            onRefreshQrCode={handleRefreshQrCode}
            onConnect={handleConnect}
            onDelete={handleDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppInstanceCard;
