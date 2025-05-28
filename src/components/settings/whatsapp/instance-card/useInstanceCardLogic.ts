
import { useState, useEffect } from "react";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";
import { useConnectionSynchronizer } from "@/hooks/whatsapp/status-monitor/useConnectionSynchronizer";
import { useInstanceConnectionWaiter } from "@/hooks/whatsapp/useInstanceConnectionWaiter";
import { useConnectionAutoChecker } from "@/hooks/whatsapp/useConnectionAutoChecker";
import { useConnectionPolling } from "../ConnectionPollingHooks";
import { toast } from "@/hooks/use-toast";

interface UseInstanceCardLogicProps {
  instance: WhatsAppInstance;
  showQrCode: boolean;
  onStatusCheck?: (instanceId: string) => void;
}

export const useInstanceCardLogic = ({
  instance,
  showQrCode,
  onStatusCheck
}: UseInstanceCardLogicProps) => {
  const [qrCodeSuccess, setQrCodeSuccess] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [connectingSpinner, setConnectingSpinner] = useState(false);
  const [supportErrorModal, setSupportErrorModal] = useState<{ open: boolean; detail?: string }>({ open: false, detail: "" });
  const [hasCheckedStatusAfterClose, setHasCheckedStatusAfterClose] = useState(false);

  const { forceSyncConnectionStatus } = useConnectionSynchronizer();

  // Calculate connection status
  const dbStatus = instance.connection_status;
  const isInstanceConnected = dbStatus === "open" || dbStatus === "connecting";
  const isInstanceDisconnected = dbStatus === "closed";
  const hasPhone = Boolean(instance.phoneNumber);

  // Connection waiter
  const { start: startWait } = useInstanceConnectionWaiter({
    instanceId: instance.id,
    instanceName: instance.instanceName,
    checkStatusFn: async (id: string) => {
      return await forceSyncConnectionStatus(id, instance.instanceName) || "";
    },
    onSuccess: () => {
      setConnectingSpinner(false);
      toast({
        title: "Conectado com sucesso!",
        description: "Seu WhatsApp foi conectado.",
        variant: "default"
      });
    },
    onTimeout: () => {
      setConnectingSpinner(false);
      toast({
        title: "Ainda não foi possível conectar!",
        description: "Verifique o app do celular ou tente novamente.",
        variant: "destructive"
      });
    },
    pollingInterval: 5000,
    timeoutDuration: 60000
  });

  // Auto checker
  const { isConnected: isAutoConnected, start: startAutoCheck, stop: stopAutoCheck } =
    useConnectionAutoChecker(instance.id, instance.instanceName);

  // Connection polling
  const { isConnectingNow, startImmediateConnectionPolling } = useConnectionPolling(instance, showQrCode);

  // QR code success effect
  useEffect(() => {
    if (instance.qrCodeUrl && !qrCodeSuccess) {
      setQrCodeSuccess(true);
      if (onStatusCheck) onStatusCheck(instance.id);
      const statusCheckInterval = setInterval(() => {
        if (onStatusCheck) onStatusCheck(instance.id);
      }, 2000);
      return () => clearInterval(statusCheckInterval);
    }
  }, [instance.qrCodeUrl, qrCodeSuccess, instance.id, instance.instanceName, onStatusCheck]);

  // Reset QR success when connected
  useEffect(() => {
    if (isInstanceConnected) setQrCodeSuccess(false);
  }, [isInstanceConnected]);

  // Periodic sync when QR is shown
  useEffect(() => {
    if ((showQrCode || qrCodeSuccess) && !isInstanceConnected) {
      const syncInterval = setInterval(() => {
        forceSyncConnectionStatus(instance.id, instance.instanceName);
      }, 5000);
      return () => clearInterval(syncInterval);
    }
  }, [showQrCode, qrCodeSuccess, instance.id, instance.instanceName, forceSyncConnectionStatus, isInstanceConnected]);

  // Status check after QR close
  useEffect(() => {
    if (
      !showQrCode &&
      !!instance.qrCodeUrl &&
      !isInstanceConnected &&
      !hasCheckedStatusAfterClose
    ) {
      setHasCheckedStatusAfterClose(true);
      forceSyncConnectionStatus(instance.id, instance.instanceName);
    } else if (showQrCode) {
      setHasCheckedStatusAfterClose(false);
    }
  }, [showQrCode, instance.qrCodeUrl, isInstanceConnected, instance.id, instance.instanceName, hasCheckedStatusAfterClose, forceSyncConnectionStatus]);

  // Auto check management
  useEffect(() => {
    if (!showQrCode && !isInstanceConnected && !!instance.qrCodeUrl) startAutoCheck();
    else if (isInstanceConnected) stopAutoCheck();
  }, [showQrCode, isInstanceConnected, instance.qrCodeUrl, startAutoCheck, stopAutoCheck]);

  // Calculated states
  const statusConnected = isInstanceConnected || isAutoConnected;
  const showQr = (showQrCode || (!statusConnected && instance.qrCodeUrl)) && !statusConnected;
  const onlyDeleteMode = showQr && !statusConnected;
  const shouldShowConnectingSpinner =
    ((connectingSpinner && !isInstanceConnected) || (isConnectingNow && !isInstanceConnected)) &&
    instance.connection_status !== "open" &&
    instance.connection_status !== "connecting";

  const handleSupportError = (detail: string) => {
    setSupportErrorModal({ open: true, detail });
  };

  return {
    // States
    actionInProgress,
    setActionInProgress,
    connectingSpinner,
    setConnectingSpinner,
    qrCodeSuccess,
    setQrCodeSuccess,
    supportErrorModal,
    setSupportErrorModal,
    
    // Calculated values
    isInstanceConnected,
    isInstanceDisconnected,
    hasPhone,
    statusConnected,
    showQr,
    onlyDeleteMode,
    shouldShowConnectingSpinner,
    
    // Functions
    handleSupportError,
    forceSyncConnectionStatus,
    startWait,
    startImmediateConnectionPolling
  };
};
