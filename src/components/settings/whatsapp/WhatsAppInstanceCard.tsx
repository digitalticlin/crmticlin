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
import ConnectedBanner from "./ConnectedBanner";

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
  const [supportErrorModal, setSupportErrorModal] = useState<{ open: boolean; detail?: string }>({ open: false, detail: "" });

  // Estado para garantir checagem única ao fechar modal QR
  const [hasCheckedStatusAfterClose, setHasCheckedStatusAfterClose] = useState(false);

  const { forceSyncConnectionStatus, isSyncing } = useConnectionSynchronizer();

  // NOVA LÓGICA: Estado calculado a partir SOMENTE do Supabase
  // NÃO FAZ MAIS CONSULTA À EVOLUTION API PARA RENDERIZAÇÃO!
  const dbStatus = instance.status;
  const isInstanceConnected = dbStatus === "open" || dbStatus === "connecting";
  const isInstanceDisconnected = dbStatus === "closed";
  const hasPhone = Boolean(instance.phoneNumber);

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

  // Depuração: log dos efeitos relacionados a polling e status
  useEffect(() => {
    console.log("[WhatsAppInstanceCard][DEBUG] useEffect: showQrCode", showQrCode, "instance.qrCodeUrl", instance.qrCodeUrl, "isInstanceConnected", isInstanceConnected, "hasCheckedStatusAfterClose", hasCheckedStatusAfterClose);
    if (
      !showQrCode &&
      !!instance.qrCodeUrl &&
      !isInstanceConnected &&
      !hasCheckedStatusAfterClose
    ) {
      setHasCheckedStatusAfterClose(true);
      console.log("[WhatsAppInstanceCard][DEBUG] Forçando forceSyncConnectionStatus após fechar QR");
      forceSyncConnectionStatus(instance.id, instance.instanceName);
    } else if (showQrCode) {
      setHasCheckedStatusAfterClose(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQrCode, instance.qrCodeUrl, isInstanceConnected, instance.id, instance.instanceName]);

  // Hook de auto-polling para checagem após fechamento do QR (sem mexer com requisições de botões)
  const { isConnected: isAutoConnected, start: startAutoCheck, stop: stopAutoCheck } =
    useConnectionAutoChecker(instance.id, instance.instanceName);

  useEffect(() => {
    if (!showQrCode && !isInstanceConnected && !!instance.qrCodeUrl) startAutoCheck();
    else if (isInstanceConnected) stopAutoCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQrCode, isInstanceConnected, instance.qrCodeUrl]);

  // Estado calculado de conexão imediato e polling
  const statusConnected = isInstanceConnected || isAutoConnected;
  const showQr = (showQrCode || (!statusConnected && instance.qrCodeUrl)) && !statusConnected;

  // Novo: Modo Only Delete — aguardando conexão após criação de instância, não conectado, mas tem qrCodeUrl
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

  // Spinner/aguardando conexão só aparece enquanto "connecting" e não "open"/"connecting"
  const shouldShowConnectingSpinner =
    ((connectingSpinner && !isInstanceConnected) || (isConnectingNow && !isInstanceConnected)) &&
    instance.status !== "open" &&
    instance.status !== "connecting";

  return (
    <>
      <Card className="overflow-hidden glass-card border-0">
        <CardContent className="p-0">
          <div className="p-4">
            <InstanceHeader
              instance={{
                ...instance,
                connected: isInstanceConnected,
                status: dbStatus
              }}
              onRefreshStatus={async () => { }}
              isStatusLoading={isLoading}
            />
            {/* Status de Conexão Visual apenas via SUPABASE */}
            {isInstanceConnected && (
              <>
                <div className="mb-2 py-2 text-center">
                  <span className="text-green-700 font-semibold">Conectado</span>
                </div>
                <div className="rounded-lg border bg-gray-50 dark:bg-gray-900/40 p-3 mb-2 text-center">
                  <div>
                    <span className="font-medium">Instância:</span> {instance.instanceName}
                  </div>
                  {hasPhone && (
                    <div>
                      <span className="font-medium">Telefone:</span> {instance.phoneNumber}
                    </div>
                  )}
                </div>
              </>
            )}
            {isInstanceDisconnected && (
              <div className="mb-2 py-2 text-center">
                <span className="text-red-700 font-semibold">Dispositivo desconectado</span>
              </div>
            )}
            <ConnectedBanner status={instance.status} />
            {isInstanceConnected && <DeviceInfoSection deviceInfo={instance.deviceInfo} />}

            <WhatsAppInstanceQrSection
              showQr={showQr}
              onlyDeleteMode={onlyDeleteMode}
              instance={instance}
              statusConnected={statusConnected}
              handleConnect={handleConnect}
            />

            {shouldShowConnectingSpinner && <ConnectionSpinner />}

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
