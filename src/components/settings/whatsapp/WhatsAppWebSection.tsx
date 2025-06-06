
import { WhatsAppWebSectionHeader } from "./WhatsAppWebSectionHeader";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";
import { useWhatsAppWebSectionLogic } from "@/hooks/whatsapp/useWhatsAppWebSectionLogic";

export const WhatsAppWebSection = () => {
  const {
    instances,
    isLoading,
    isConnectingOrPolling,
    creationStage,
    localShowQRModal,
    localSelectedQRCode,
    localSelectedInstanceName,
    handleConnect,
    handleDeleteInstance,
    handleGenerateQR,
    handleShowQR,
    closeQRModal
  } = useWhatsAppWebSectionLogic();

  console.log('[WhatsApp Web Section] 🎯 FLUXO ISOLADO - Renderizando:', {
    instancesCount: instances.length,
    isLoading,
    modalOpen: localShowQRModal,
    hasQRCode: !!localSelectedQRCode,
    creationStage
  });

  if (isLoading) {
    return <WhatsAppWebLoadingState />;
  }

  return (
    <div className="space-y-6">
      <WhatsAppWebSectionHeader 
        onConnect={handleConnect}
        isConnecting={isConnectingOrPolling}
        isLoading={isLoading}
        companyLoading={false}
        creationStage={creationStage}
      />

      {instances.length === 0 ? (
        <WhatsAppWebEmptyState 
          onConnect={handleConnect}
          isConnecting={isConnectingOrPolling}
        />
      ) : (
        <WhatsAppWebInstancesGrid 
          instances={instances}
          onGenerateQR={handleGenerateQR}
          onDelete={handleDeleteInstance}
          onShowQR={handleShowQR}
        />
      )}

      <ImprovedQRCodeModal 
        isOpen={localShowQRModal}
        onOpenChange={closeQRModal}
        qrCodeUrl={localSelectedQRCode}
        instanceName={localSelectedInstanceName}
        isWaitingForQR={false}
        currentAttempt={0}
        maxAttempts={0}
      />
    </div>
  );
};
