
import FloatingAddWhatsAppButton from "./FloatingAddWhatsAppButton";
import PlaceholderQrModal from "./PlaceholderQrModal";
import WaitingForConnectionCard from "./WaitingForConnectionCard";
import { usePlaceholderLogic } from "./PlaceholderLogicHooks";

interface WhatsAppPlaceholderSectionProps {
  userEmail: string;
  isSuperAdmin: boolean;
  onRefreshInstances: () => void;
}

export const WhatsAppPlaceholderSection = ({
  userEmail,
  isSuperAdmin,
  onRefreshInstances
}: WhatsAppPlaceholderSectionProps) => {
  const placeholderLogic = usePlaceholderLogic({ userEmail, isSuperAdmin });

  const showWaitingCard = placeholderLogic.waitingForOpen && placeholderLogic.instanceName;

  return (
    <>
      {/* Botão flutuante "+" */}
      <FloatingAddWhatsAppButton
        onClick={placeholderLogic.handleAddWhatsApp}
        disabled={placeholderLogic.isCreating}
        isLoading={placeholderLogic.isCreating}
        isSuperAdmin={isSuperAdmin}
        isNewUser={placeholderLogic.isNewUser}
      />

      {/* Modal do QR Code e lógica de adicionar */}
      <PlaceholderQrModal
        isOpen={placeholderLogic.qrCodeDialog.isOpen}
        qrCodeUrl={placeholderLogic.qrCodeDialog.qrCodeUrl}
        isCreating={placeholderLogic.isCreating}
        onScanned={placeholderLogic.handleScanned}
        onRegenerate={placeholderLogic.handleRegenerate}
        onCancel={placeholderLogic.handleCancel}
        instanceName={placeholderLogic.instanceName}
        onRefreshInstances={onRefreshInstances}
      />

      {/* Card de "aguardando conexão" após scan QR */}
      {showWaitingCard && (
        <div className="max-w-[450px] mx-auto">
          <WaitingForConnectionCard
            instanceName={placeholderLogic.instanceName!}
            onDelete={placeholderLogic.handleDeleteWaiting}
          />
        </div>
      )}
    </>
  );
};
