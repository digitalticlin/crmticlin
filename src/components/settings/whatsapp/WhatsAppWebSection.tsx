
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppWebSectionLogic } from "@/hooks/whatsapp/useWhatsAppWebSectionLogic";
import { WhatsAppWebSectionHeader } from "./WhatsAppWebSectionHeader";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";
import { WhatsAppWebWaitingState } from "./WhatsAppWebWaitingState";
import { WhatsAppWebQRModal } from "./WhatsAppWebQRModal";

export const WhatsAppWebSection = () => {
  console.log('[WhatsAppWebSection] Component rendering - OTIMIZADO');
  
  const { companyId, loading: companyLoading } = useCompanyData();
  
  const {
    instances,
    isLoading,
    isConnectingOrPolling,
    localShowQRModal,
    localSelectedQRCode,
    localSelectedInstanceName,
    isWaitingForQR,
    currentAttempt,
    maxAttempts,
    handleConnect,
    handleDeleteInstance,
    handleRefreshQR,
    handleShowQR,
    closeQRModal
  } = useWhatsAppWebSectionLogic();

  return (
    <div className="space-y-6">
      {/* Status de Preparação - OTIMIZADO */}
      <WhatsAppWebWaitingState
        isWaitingForQR={isWaitingForQR}
        instanceName={localSelectedInstanceName}
        currentAttempt={currentAttempt}
        maxAttempts={maxAttempts}
      />

      {/* Header com botão de conectar */}
      <WhatsAppWebSectionHeader
        onConnect={handleConnect}
        isConnecting={isConnectingOrPolling}
        isLoading={isLoading}
        companyLoading={companyLoading}
      />

      {/* Grid de instâncias ou estado vazio */}
      {isLoading || companyLoading ? (
        <WhatsAppWebLoadingState />
      ) : instances.length > 0 ? (
        <WhatsAppWebInstancesGrid
          instances={instances}
          onRefreshQR={handleRefreshQR}
          onDelete={handleDeleteInstance}
          onShowQR={handleShowQR}
        />
      ) : (
        <WhatsAppWebEmptyState
          onConnect={handleConnect}
          isConnecting={isConnectingOrPolling}
        />
      )}

      {/* Modal QR Code - OTIMIZADO */}
      <WhatsAppWebQRModal
        isOpen={localShowQRModal}
        onOpenChange={(open) => !open && closeQRModal()}
        qrCodeUrl={localSelectedQRCode}
        instanceName={localSelectedInstanceName}
        isWaitingForQR={isWaitingForQR}
        currentAttempt={currentAttempt}
        maxAttempts={maxAttempts}
      />
    </div>
  );
};
