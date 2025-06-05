
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";

interface WhatsAppWebQRModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeUrl: string | null;
  instanceName: string;
  isWaitingForQR?: boolean;
  currentAttempt?: number;
  maxAttempts?: number;
}

export const WhatsAppWebQRModal = ({
  isOpen,
  onOpenChange,
  qrCodeUrl,
  instanceName,
  isWaitingForQR = false,
  currentAttempt = 0,
  maxAttempts = 20
}: WhatsAppWebQRModalProps) => {
  return (
    <ImprovedQRCodeModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      qrCodeUrl={qrCodeUrl}
      instanceName={instanceName}
      isWaitingForQR={isWaitingForQR}
      currentAttempt={currentAttempt}
      maxAttempts={maxAttempts}
    />
  );
};
