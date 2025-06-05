
import { useState } from "react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppWebSectionHeader } from "./WhatsAppWebSectionHeader";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { WhatsAppWebQRModal } from "./WhatsAppWebQRModal";

export const WhatsAppWebSection = () => {
  const {
    instances,
    isLoading,
    isConnecting,
    error,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    createInstance,
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    refetch
  } = useWhatsAppWebInstances();

  console.log('[WhatsApp Web Section] Renderizando com:', {
    instancesCount: instances.length,
    isLoading
  });

  // Função para criar instância (corrigindo interface)
  const handleCreateInstance = async () => {
    const instanceName = `WhatsApp_${Date.now()}`;
    await createInstance(instanceName);
  };

  // Função para mostrar QR Code
  const handleShowQR = (instance: any) => {
    // Implementar lógica para mostrar QR Code se necessário
  };

  if (isLoading) {
    return <WhatsAppWebLoadingState />;
  }

  return (
    <div className="space-y-6">
      <WhatsAppWebSectionHeader 
        onConnect={handleCreateInstance}
        isConnecting={isConnecting}
        isLoading={isLoading}
        companyLoading={false}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Erro: {error}</p>
        </div>
      )}

      {instances.length === 0 ? (
        <WhatsAppWebEmptyState 
          onConnect={handleCreateInstance}
          isConnecting={isConnecting}
        />
      ) : (
        <WhatsAppWebInstancesGrid 
          instances={instances}
          onRefreshQR={refreshQRCode}
          onDelete={deleteInstance}
          onShowQR={handleShowQR}
        />
      )}

      <WhatsAppWebQRModal 
        isOpen={showQRModal}
        onOpenChange={closeQRModal}
        qrCodeUrl={selectedQRCode}
        instanceName={selectedInstanceName}
      />
    </div>
  );
};
