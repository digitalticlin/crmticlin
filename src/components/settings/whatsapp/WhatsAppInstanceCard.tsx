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
import { LoaderCircle } from "lucide-react";
import { WhatsAppSupportErrorModal } from "./WhatsAppSupportErrorModal";
import { Button } from "@/components/ui/button";
import { useConnectionAutoChecker } from "@/hooks/whatsapp/useConnectionAutoChecker";

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

  // NOVO: Estado para ativar processo de aguardando conexão
  const [connectingSpinner, setConnectingSpinner] = useState(false);

  // Novo hook para esperar a conexão após fechar modal QR
  const {
    waiting, cancelled, timedOut, start: startWait, cancel: cancelWait
  } = useInstanceConnectionWaiter({
    instanceId: instance.id,
    instanceName: instance.instanceName,
    // Usa connection check já existente do Synchronizer!
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

  // NOVO: Estado para suporte de erros
  const [supportErrorModal, setSupportErrorModal] = useState<{open: boolean; detail?: string}>({open: false, detail: ""});

  // Handler para mostrar modal suporte nos erros
  const handleSupportError = (detail: string) => {
    setSupportErrorModal({ open: true, detail });
  };

  // Função para uso do botão "Já conectei"
  const handleConnectClickAndCloseQR = () => {
    // Fecha QR/modal imediatamente, ativa spinner. O startWait() já inicia polling no card.
    setConnectingSpinner(true);
    startWait();
    // Aqui pode-se logar/guardar que usuário sinalizou conexão manual
  };

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

  // NOVO: Monitorar quando fechar o modal QR e mostrar spinner se ainda não está connected
  useEffect(() => {
    if (!showQrCode && !instance.connected && !!instance.qrCodeUrl) {
      setConnectingSpinner(true);
      startWait();
    } else if (instance.connected) {
      setConnectingSpinner(false);
      cancelWait();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQrCode, instance.connected, instance.qrCodeUrl]);

  // NOVO: Hook polling automático após fechamento do modal QRCode
  const { isWaiting: isAutoWaiting, isConnected: isAutoConnected, start: startAutoCheck, stop: stopAutoCheck } =
    useConnectionAutoChecker(instance.id, instance.instanceName);

  // NOVA: Quando QR modal fechar (showQrCode passa de true pra false), iniciar monitoramento
  useEffect(() => {
    // Se modal fechou (showQrCode == false) e não está conectado, dispara polling auto
    if (!showQrCode && !instance.connected && !!instance.qrCodeUrl) {
      startAutoCheck();
    }
    // Opcional: parar quando ficar invisível ou conectado
    else if (instance.connected) {
      stopAutoCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQrCode, instance.connected, instance.qrCodeUrl]);
  
  // Quando polling auto detectar "open", mostrar conectado sem QR!
  const statusConnected = instance.connected || isAutoConnected;
  const showQr = (showQrCode || (!statusConnected && instance.qrCodeUrl)) && !statusConnected;
  
  // Adaptação das funções de ação para mostrar modal de suporte em erros
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
    } catch (error: any) {
      handleSupportError(error?.message || "Erro desconhecido ao tentar conectar.");
    } finally {
      setActionInProgress(false);
    }
  };

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
    } catch (error: any) {
      handleSupportError(error?.message || "Erro desconhecido ao atualizar QR Code.");
    } finally {
      setActionInProgress(false);
    }
  };
  
  const handleStatusRefresh = async () => {
    try {
      console.log(`Manually refreshing status for ${instance.instanceName}`);
      await forceSyncConnectionStatus(instance.id, instance.instanceName);
    } catch (error) {
      console.error("Error refreshing status:", error);
    }
  };

  const handleDelete = async () => {
    try {
      console.log(`Deleting instance ${instance.id}: ${instance.instanceName}`);
      setActionInProgress(true);
      await onDelete(instance.id);
      console.log(`Instance ${instance.instanceName} deleted`);
    } catch (error: any) {
      handleSupportError(error?.message || "Erro desconhecido ao tentar remover instância.");
    } finally {
      setActionInProgress(false);
    }
  };

  // Determine if QR code should be shown (when available and shown)
  const shouldShowQrCode = (showQrCode || qrCodeSuccess) && instance.qrCodeUrl;
  
  // Determine if we're currently loading status
  const isStatusLoading = isLoading || isSyncing[instance.id];

  // Determinar se mostra spinner de conexão
  const shouldShowConnectingSpinner = connectingSpinner && !instance.connected;

  return (
    <>
      <Card className="overflow-hidden glass-card border-0">
        <CardContent className="p-0">
          <div className="p-4">
            {/* Header section - always visible */}
            <InstanceHeader 
              instance={{...instance, connected: statusConnected}} 
              onRefreshStatus={async () => {}}
              isStatusLoading={isLoading}
            />
            
            {/* Connected Section - Only shown when connected */}
            {statusConnected && (
              <DeviceInfoSection deviceInfo={instance.deviceInfo} />
            )}
            
            {/* QR Code Section - Only shown when disconnected and QR code exists */}
            {showQr && instance.qrCodeUrl && !statusConnected && (
              <>
                <QrCodeSection qrCodeUrl={instance.qrCodeUrl} />
                <Button variant="outline" className="w-full mt-2"
                  onClick={() => {}}>
                  Já conectei
                </Button>
              </>
            )}
            
            {/* NOVO: Spinner "Conectando..." após fechar QR, enquanto polling */}
            {isAutoWaiting && !statusConnected && (
              <div className="flex flex-col items-center justify-center gap-2 py-4 animate-fade-in">
                <LoaderCircle className="animate-spin text-primary w-8 h-8" />
                <span className="text-sm text-muted-foreground">Aguardando confirmação da conexão...<br />Isso pode levar alguns segundos.</span>
              </div>
            )}
            
            {/* Action Buttons - Só mostra "Deletar" quando conectado */}
            <InstanceActionButtons
              connected={statusConnected}
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
      {/* Modal global de suporte para erros críticos */}
      <WhatsAppSupportErrorModal
        open={supportErrorModal.open}
        onClose={() => setSupportErrorModal({ open: false })}
        errorDetail={supportErrorModal.detail}
        // onRetry opcional: poderia re-executar última ação se desejado
      />
    </>
  );
};

export default WhatsAppInstanceCard;
