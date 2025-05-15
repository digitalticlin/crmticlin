
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";
import InstanceHeader from "./InstanceHeader";
import DeviceInfoSection from "./DeviceInfoSection";
import QrCodeSection from "./QrCodeSection";
import InstanceActionButtons from "./InstanceActionButtons";
import { useConnectionSynchronizer } from "@/hooks/whatsapp/status-monitor/useConnectionSynchronizer";
import { useInstanceConnectionWaiter } from "@/hooks/whatsapp/useInstanceConnectionWaiter";
import { toast } from "@/hooks/use-toast";
import { WhatsAppSupportErrorModal } from "./WhatsAppSupportErrorModal";
import { Button } from "@/components/ui/button";
import { useConnectionAutoChecker } from "@/hooks/whatsapp/useConnectionAutoChecker";
import { useConnectionPolling } from "./ConnectionPollingHooks";
import ConnectionSpinner from "./ConnectionSpinner";
import WhatsAppInstanceMainActions from "./WhatsAppInstanceMainActions";
import WhatsAppInstanceQrSection from "./WhatsAppInstanceQrSection";

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
  // Estados locais
  const [qrCodeSuccess, setQrCodeSuccess] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [connectingSpinner, setConnectingSpinner] = useState(false);
  const [supportErrorModal, setSupportErrorModal] = useState<{open: boolean; detail?: string}>({open: false, detail: ""});

  const { forceSyncConnectionStatus, isSyncing } = useConnectionSynchronizer();

  // Computa status real da instância levando em conta "open" como conectado
  // Importante: se já houver um campo status, use-o, senão derive de `connected` padrão.
  const isInstanceConnected = instance.connected || instance.status === "open";
  const instanceStatus = instance.status === "open" ? "connected" 
    : instance.status ? instance.status 
    : (instance.connected ? "connected" : "disconnected");

  // Suporte para esperar conexão após QR
  const {
    start: startWait,
    cancel: cancelWait
  } = useInstanceConnectionWaiter({
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

  // Handler para mostrar modal suporte em erros
  const handleSupportError = (detail: string) => {
    setSupportErrorModal({ open: true, detail });
  };

  // "Já conectei" manual no modal QR
  const handleConnectClickAndCloseQR = () => {
    setConnectingSpinner(true);
    startWait();
  };

  // Exibe QR code quando chegar
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

  // Reset sucesso do QR ao conectar
  useEffect(() => {
    // Se status virar "connected" ou "open", reset o sucesso do QR
    if (isInstanceConnected) setQrCodeSuccess(false);
  }, [isInstanceConnected]);

  // Sincronização periódica quando QR está exibido
  useEffect(() => {
    if ((showQrCode || qrCodeSuccess) && !isInstanceConnected) {
      const syncInterval = setInterval(() => {
        forceSyncConnectionStatus(instance.id, instance.instanceName);
      }, 5000);
      return () => clearInterval(syncInterval);
    }
  }, [showQrCode, qrCodeSuccess, instance.id, instance.instanceName, forceSyncConnectionStatus, isInstanceConnected]);

  // Garante spinner aguardando conexão se fechar QR e ainda não conectado/aberto
  useEffect(() => {
    // Aqui valida se está "open" ou "connected" e cancela spinner/polling se for o caso
    if (!showQrCode && !isInstanceConnected && !!instance.qrCodeUrl) {
      setConnectingSpinner(true);
      startWait();
    } else if (isInstanceConnected) {
      setConnectingSpinner(false);
      cancelWait();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQrCode, isInstanceConnected, instance.qrCodeUrl]);

  // Hook de auto-polling mais lento
  const { isConnected: isAutoConnected, start: startAutoCheck, stop: stopAutoCheck } =
    useConnectionAutoChecker(instance.id, instance.instanceName);

  useEffect(() => {
    // Auto-check só permitido se não está "connected"/"open"
    if (!showQrCode && !isInstanceConnected && !!instance.qrCodeUrl) startAutoCheck();
    else if (isInstanceConnected) stopAutoCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQrCode, isInstanceConnected, instance.qrCodeUrl]);

  // Estado calculado de conexão imediato e polling
  const statusConnected = isInstanceConnected || isAutoConnected;
  const showQr = (showQrCode || (!statusConnected && instance.qrCodeUrl)) && !statusConnected;

  // NOVO: Modo Only Delete — aguardando conexão após criação de instância, não conectado, mas tem qrCodeUrl
  const onlyDeleteMode = showQr && !statusConnected;

  // HOOK DE POLLING MODULARIZADO
  const { isConnectingNow, startImmediateConnectionPolling } = useConnectionPolling(instance, showQrCode);

  // Adaptação das funções de ação
  const handleConnect = async () => {
    try {
      setActionInProgress(true);
      setQrCodeSuccess(false);
      await onConnect(instance.id);
      await forceSyncConnectionStatus(instance.id, instance.instanceName);
      if (onStatusCheck) onStatusCheck(instance.id);
      startImmediateConnectionPolling();
    } catch (error: any) {
      handleSupportError(error?.message || "Erro desconhecido ao tentar conectar.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRefreshQrCode = async () => {
    try {
      setActionInProgress(true);
      setQrCodeSuccess(false);
      await onRefreshQrCode(instance.id);
      await forceSyncConnectionStatus(instance.id, instance.instanceName);
      if (onStatusCheck) onStatusCheck(instance.id);
    } catch (error: any) {
      handleSupportError(error?.message || "Erro desconhecido ao atualizar QR Code.");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionInProgress(true);
      await onDelete(instance.id);
    } catch (error: any) {
      handleSupportError(error?.message || "Erro desconhecido ao tentar remover instância.");
    } finally {
      setActionInProgress(false);
    }
  };

  // -- Layout e ações
  // spinner/aguardando conexão só aparece enquanto "connecting" e não "open"/"connected"
  const shouldShowConnectingSpinner =
    ((connectingSpinner && !isInstanceConnected) || (isConnectingNow && !isInstanceConnected)) && instance.status !== "open";

  return (
    <>
      <Card className="overflow-hidden glass-card border-0">
        <CardContent className="p-0">
          <div className="p-4">
            <InstanceHeader
              // força badge de conectado para status open também
              instance={{ ...instance, connected: isInstanceConnected, status: instanceStatus }}
              onRefreshStatus={async () => { }}
              isStatusLoading={isLoading}
            />
            {isInstanceConnected && <DeviceInfoSection deviceInfo={instance.deviceInfo} />}

            {/* NOVO: Seção de QR Code (condicional, agora extraída) */}
            <WhatsAppInstanceQrSection
              showQr={showQr}
              onlyDeleteMode={onlyDeleteMode}
              instance={instance}
              statusConnected={statusConnected}
              handleConnect={handleConnect}
            />

            {shouldShowConnectingSpinner && <ConnectionSpinner />}

            {/* NOVA: Seção de Botões principais (condicional, extraída) */}
            <WhatsAppInstanceMainActions
              statusConnected={statusConnected}
              instance={instance}
              showQr={showQr}
              onlyDeleteMode={onlyDeleteMode}
              isLoading={isLoading}
              actionInProgress={actionInProgress}
              onConnect={handleConnect}
              onDelete={handleDelete}
              onRefreshQrCode={handleRefreshQrCode}
            />
          </div>
        </CardContent>
      </Card>
      <WhatsAppSupportErrorModal
        open={supportErrorModal.open}
        onClose={() => setSupportErrorModal({ open: false })}
        errorDetail={supportErrorModal.detail}
      />
    </>
  );
};

export default WhatsAppInstanceCard;
