
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";
import WhatsAppInstanceQrSection from "../WhatsAppInstanceQrSection";
import ConnectionSpinner from "../ConnectionSpinner";
import WhatsAppInstanceMainActions from "../WhatsAppInstanceMainActions";

interface InstanceCardActionsProps {
  instance: WhatsAppInstance;
  showQr: boolean;
  onlyDeleteMode: boolean;
  statusConnected: boolean;
  shouldShowConnectingSpinner: boolean;
  isLoading: boolean;
  actionInProgress: boolean;
  onConnect: () => Promise<void>;
  onDelete: () => Promise<void>;
  onRefreshQrCode: () => Promise<void>;
}

export const InstanceCardActions = ({
  instance,
  showQr,
  onlyDeleteMode,
  statusConnected,
  shouldShowConnectingSpinner,
  isLoading,
  actionInProgress,
  onConnect,
  onDelete,
  onRefreshQrCode
}: InstanceCardActionsProps) => {
  return (
    <>
      <WhatsAppInstanceQrSection
        showQr={showQr}
        onlyDeleteMode={onlyDeleteMode}
        instance={instance}
        statusConnected={statusConnected}
        handleConnect={onConnect}
      />

      {shouldShowConnectingSpinner && <ConnectionSpinner />}

      <WhatsAppInstanceMainActions
        statusConnected={statusConnected}
        instance={instance}
        showQr={showQr}
        onlyDeleteMode={onlyDeleteMode}
        isLoading={isLoading}
        actionInProgress={actionInProgress}
        onConnect={onConnect}
        onDelete={onDelete}
        onRefreshQrCode={onRefreshQrCode}
      />
    </>
  );
};
