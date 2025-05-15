
import { useState, useEffect } from "react";
import { useAutoConnectionPolling } from "@/hooks/whatsapp/useAutoConnectionPolling";

/**
 * Centraliza flags e lógica de polling imediato/remoto de conexão
 */
export function useConnectionPolling(instance, showQrCode) {
  const [triggerAutoConnect, setTriggerAutoConnect] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(instance.connected);

  // Handler para ativar polling assim que fecha QR ou clica "Já conectei"
  const startImmediateConnectionPolling = () => {
    if (!instance.connected) {
      setTriggerAutoConnect(true);
      setAlreadyConnected(false);
    }
  };

  // Dispara polling imediato ao fechar QR
  useEffect(() => {
    if (!showQrCode && !!instance.qrCodeUrl && !instance.connected && !alreadyConnected) {
      startImmediateConnectionPolling();
    }
    if (showQrCode) {
      setTriggerAutoConnect(false);
      setAlreadyConnected(instance.connected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQrCode, instance.connected, instance.qrCodeUrl]);

  // Hook polling especializado
  const { connecting: isConnectingNow } = useAutoConnectionPolling({
    active: triggerAutoConnect,
    instanceId: instance.id,
    instanceName: instance.instanceName,
    onConnected: () => {
      setAlreadyConnected(true);
      setTriggerAutoConnect(false);
    },
    onTimeout: () => {
      setTriggerAutoConnect(false);
    }
  });

  return {
    isConnectingNow,
    startImmediateConnectionPolling,
  };
}
