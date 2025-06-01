
import { useState } from "react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { AddWhatsAppWebCard } from "./AddWhatsAppWebCard";
import { AutoQRCodeModal } from "./AutoQRCodeModal";
import { InstanceQRModal } from "./InstanceQRModal";
import { ConnectedBanner } from "./ConnectedBanner";

export const WhatsAppWebSection = () => {
  console.log('[WhatsAppWebSection] Rendering section');
  
  const [qrModalInstanceId, setQrModalInstanceId] = useState<string | null>(null);
  
  const {
    instances,
    loading,
    error,
    autoConnectState,
    createInstance,
    deleteInstance,
    refreshQRCode,
    syncInstanceStatus,
    forceSync,
    closeQRModal,
    openQRModal
  } = useWhatsAppWebInstances();

  const connectedInstances = instances.filter(instance => 
    ['ready', 'open'].includes(instance.web_status || instance.connection_status) && 
    instance.phone && instance.phone !== ''
  );

  const handleOpenQRModal = (instanceId: string) => {
    setQrModalInstanceId(instanceId);
  };

  const handleCloseQRModal = () => {
    setQrModalInstanceId(null);
  };

  console.log('[WhatsAppWebSection] Instances loaded:', {
    total: instances.length,
    connected: connectedInstances.length,
    loading
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando instâncias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {connectedInstances.length > 0 && (
        <ConnectedBanner count={connectedInstances.length} />
      )}

      {instances.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {instances.map(instance => (
            <WhatsAppWebInstanceCard
              key={instance.id}
              instance={instance}
              onShowQR={() => handleOpenQRModal(instance.id)}
              onRefreshQR={() => refreshQRCode(instance.id)}
              onDelete={() => deleteInstance(instance.id)}
              onForceSync={() => forceSync(instance.id)}
            />
          ))}
        </div>
      )}

      <AddWhatsAppWebCard onCreateInstance={createInstance} />

      <AutoQRCodeModal
        isOpen={autoConnectState.showQRModal}
        onClose={closeQRModal}
        instance={instances.find(i => i.id === autoConnectState.activeInstanceId)}
        onRefreshQR={refreshQRCode}
      />

      {qrModalInstanceId && (
        <InstanceQRModal
          isOpen={!!qrModalInstanceId}
          onClose={handleCloseQRModal}
          instance={instances.find(i => i.id === qrModalInstanceId)}
          onRefreshQR={refreshQRCode}
        />
      )}
    </div>
  );
};
