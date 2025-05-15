import { usePlaceholderLogic } from "./PlaceholderLogicHooks";
import AddWhatsAppCard from "./AddWhatsAppCard";
import WaitingForConnectionCard from "./WaitingForConnectionCard";
import PlaceholderQrModal from "./PlaceholderQrModal";

interface PlaceholderInstanceCardProps {
  isSuperAdmin?: boolean;
  userEmail: string;
  onRefreshInstances?: () => void;      // nova prop (opcional, para compatibilidade)
}

const PlaceholderInstanceCard = ({
  isSuperAdmin = false,
  userEmail,
  onRefreshInstances,
}: PlaceholderInstanceCardProps) => {
  const {
    isNewUser,
    isCreating,
    waitingForOpen,
    instanceName,
    handleAddWhatsApp,
    handleScanned,
    handleRegenerate,
    handleCancel,
    handleDeleteWaiting,
    qrCodeDialog,
  } = usePlaceholderLogic({ userEmail, isSuperAdmin });

  if (waitingForOpen && instanceName) {
    return (
      <WaitingForConnectionCard
        instanceName={instanceName}
        onDelete={handleDeleteWaiting}
      />
    );
  }

  return (
    <>
      <AddWhatsAppCard
        isSuperAdmin={isSuperAdmin}
        isNewUser={isNewUser}
        isCreating={isCreating}
        onAdd={handleAddWhatsApp}
      />
      <PlaceholderQrModal
        isOpen={qrCodeDialog.isOpen}
        qrCodeUrl={qrCodeDialog.qrCodeUrl}
        isCreating={isCreating}
        onScanned={handleScanned}
        onRegenerate={handleRegenerate}
        onCancel={handleCancel}
        instanceName={instanceName}
        onRefreshInstances={onRefreshInstances}
      />
    </>
  );
};

export default PlaceholderInstanceCard;
