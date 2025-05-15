
import QrCodeActionCard from "./QrCodeActionCard";

interface PlaceholderQrModalProps {
  isOpen: boolean;
  qrCodeUrl?: string;
  isCreating: boolean;
  onScanned: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  instanceName: string | null;
}

const PlaceholderQrModal = ({
  isOpen,
  qrCodeUrl,
  isCreating,
  onScanned,
  onRegenerate,
  onCancel,
  instanceName,
}: PlaceholderQrModalProps) => {
  if (!isOpen || !qrCodeUrl) return null;
  return (
    <QrCodeActionCard
      qrCodeUrl={qrCodeUrl}
      isLoading={isCreating}
      onScanned={onScanned}
      onRegenerate={onRegenerate}
      onCancel={onCancel}
      instanceName={instanceName}
    />
  );
};

export default PlaceholderQrModal;
