
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";

interface WhatsAppWebQRModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeUrl: string | null;
  instanceName: string;
}

export const WhatsAppWebQRModal = ({
  isOpen,
  onOpenChange,
  qrCodeUrl,
  instanceName
}: WhatsAppWebQRModalProps) => {
  return (
    <ImprovedQRCodeModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      qrCodeUrl={qrCodeUrl}
      instanceName={instanceName}
    />
  );
};
