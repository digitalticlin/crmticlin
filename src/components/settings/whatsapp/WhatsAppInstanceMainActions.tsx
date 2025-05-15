
import { Button } from "@/components/ui/button";
import InstanceActionButtons from "./InstanceActionButtons";

interface WhatsAppInstanceMainActionsProps {
  statusConnected: boolean;
  instance: any;
  showQr: boolean;
  onlyDeleteMode: boolean;
  isLoading: boolean;
  actionInProgress: boolean;
  onConnect: () => Promise<void>;
  onDelete: () => Promise<void>;
  onRefreshQrCode: () => Promise<void>;
}

export default function WhatsAppInstanceMainActions({
  statusConnected,
  instance,
  showQr,
  onlyDeleteMode,
  isLoading,
  actionInProgress,
  onConnect,
  onDelete,
  onRefreshQrCode
}: WhatsAppInstanceMainActionsProps) {
  return (
    <InstanceActionButtons
      connected={statusConnected}
      hasQrCode={!!instance.qrCodeUrl}
      isLoading={isLoading}
      actionInProgress={actionInProgress}
      onRefreshQrCode={onRefreshQrCode}
      onConnect={onConnect}
      onDelete={onDelete}
      onlyDeleteMode={onlyDeleteMode}
    />
  );
}
