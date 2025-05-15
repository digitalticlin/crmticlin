
import { usePlaceholderLogic } from "./PlaceholderLogicHooks";
import AddWhatsAppCard from "./AddWhatsAppCard";
import WaitingForConnectionCard from "./WaitingForConnectionCard";
import PlaceholderQrModal from "./PlaceholderQrModal";

interface PlaceholderInstanceCardProps {
  isSuperAdmin?: boolean;
  userEmail: string;
}

const PlaceholderInstanceCard = ({
  isSuperAdmin = false,
  userEmail
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
      />
    </>
  );
};

export default PlaceholderInstanceCard;
