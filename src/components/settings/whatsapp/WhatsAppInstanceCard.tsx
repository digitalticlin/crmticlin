
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";
import { WhatsAppSupportErrorModal } from "./WhatsAppSupportErrorModal";
import { InstanceCardHeader } from "./instance-card/InstanceCardHeader";
import { InstanceStatusDisplay } from "./instance-card/InstanceStatusDisplay";
import { InstanceCardActions } from "./instance-card/InstanceCardActions";
import { useInstanceCardLogic } from "./instance-card/useInstanceCardLogic";

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
  const {
    actionInProgress,
    setActionInProgress,
    supportErrorModal,
    setSupportErrorModal,
    isInstanceConnected,
    isInstanceDisconnected,
    hasPhone,
    statusConnected,
    showQr,
    onlyDeleteMode,
    shouldShowConnectingSpinner,
    handleSupportError,
    forceSyncConnectionStatus,
    startImmediateConnectionPolling
  } = useInstanceCardLogic({
    instance,
    showQrCode,
    onStatusCheck
  });

  const handleConnect = async () => {
    try {
      setActionInProgress(true);
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

  return (
    <>
      <Card className="overflow-hidden glass-card border-0 w-full max-w-sm md:max-w-md mx-auto flex flex-col items-center min-h-[260px] md:min-h-[250px] md:min-w-[450px] rounded-2xl">
        <CardContent className="p-0">
          <div className="p-4">
            <InstanceCardHeader
              instance={instance}
              isInstanceConnected={isInstanceConnected}
              isLoading={isLoading}
              onRefreshStatus={async () => {}}
            />

            <InstanceStatusDisplay
              instance={instance}
              isInstanceConnected={isInstanceConnected}
              isInstanceDisconnected={isInstanceDisconnected}
              hasPhone={hasPhone}
            />

            <InstanceCardActions
              instance={instance}
              showQr={showQr}
              onlyDeleteMode={onlyDeleteMode}
              statusConnected={statusConnected}
              shouldShowConnectingSpinner={shouldShowConnectingSpinner}
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
