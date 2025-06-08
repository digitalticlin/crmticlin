
import { useState } from "react";
import { useWhatsAppWebSectionLogic } from "@/hooks/whatsapp/useWhatsAppWebSectionLogic";
import { WhatsAppWebSectionHeader } from "./WhatsAppWebSectionHeader";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { WhatsAppWebQRModal } from "./WhatsAppWebQRModal";
import { WhatsAppWebWaitingState } from "./WhatsAppWebWaitingState";
import { AutoImportExecutor } from "./AutoImportExecutor";
import { VPSWebhookInvestigator } from "./VPSWebhookInvestigator";

export const WhatsAppWebSection = () => {
  const {
    instances,
    isLoading,
    isCreatingInstance,
    creationStage,
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

  const [showDebugTools, setShowDebugTools] = useState(false);

  if (isLoading) {
    return <WhatsAppWebLoadingState />;
  }

  return (
    <div className="space-y-6">
      <WhatsAppWebSectionHeader 
        onConnect={handleConnect}
        isConnecting={isConnectingOrPolling}
        creationStage={creationStage}
      />

      {/* Ferramentas de Debug/Investigação */}
      <div className="space-y-4">
        <button
          onClick={() => setShowDebugTools(!showDebugTools)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showDebugTools ? 'Ocultar' : 'Mostrar'} ferramentas de diagnóstico
        </button>
        
        {showDebugTools && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AutoImportExecutor />
            <VPSWebhookInvestigator />
          </div>
        )}
      </div>

      {isCreatingInstance && (
        <WhatsAppWebWaitingState 
          stage={creationStage}
          isWaitingForQR={isWaitingForQR}
          currentAttempt={currentAttempt}
          maxAttempts={maxAttempts}
        />
      )}

      {instances.length === 0 && !isCreatingInstance ? (
        <WhatsAppWebEmptyState />
      ) : (
        <WhatsAppWebInstancesGrid
          instances={instances}
          onDeleteInstance={handleDeleteInstance}
          onRefreshQR={handleRefreshQR}
          onShowQR={handleShowQR}
        />
      )}

      <WhatsAppWebQRModal
        isOpen={localShowQRModal}
        onClose={closeQRModal}
        qrCode={localSelectedQRCode}
        instanceName={localSelectedInstanceName}
        isWaitingForQR={isWaitingForQR}
        currentAttempt={currentAttempt}
        maxAttempts={maxAttempts}
      />
    </div>
  );
};
