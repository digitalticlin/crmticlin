
import { useState } from "react";
import { useWhatsAppWebSectionLogic } from "@/hooks/whatsapp/useWhatsAppWebSectionLogic";
import { WhatsAppWebSectionHeader } from "./WhatsAppWebSectionHeader";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { WhatsAppWebQRModal } from "./WhatsAppWebQRModal";
import { WhatsAppWebWaitingState } from "./WhatsAppWebWaitingState";

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

      {isCreatingInstance && (
        <WhatsAppWebWaitingState 
          isWaitingForQR={isWaitingForQR}
          instanceName={localSelectedInstanceName}
          currentAttempt={currentAttempt}
          maxAttempts={maxAttempts}
        />
      )}

      {instances.length === 0 && !isCreatingInstance ? (
        <WhatsAppWebEmptyState 
          onConnect={handleConnect}
          isConnecting={isConnectingOrPolling}
        />
      ) : (
        <WhatsAppWebInstancesGrid
          instances={instances}
          onDelete={handleDeleteInstance}
          onRefreshQR={handleRefreshQR}
          onShowQR={handleShowQR}
        />
      )}

      <WhatsAppWebQRModal
        isOpen={localShowQRModal}
        onOpenChange={closeQRModal}
        qrCodeUrl={localSelectedQRCode}
        instanceName={localSelectedInstanceName}
        isWaitingForQR={isWaitingForQR}
        currentAttempt={currentAttempt}
        maxAttempts={maxAttempts}
      />
    </div>
  );
};
