
import { useState, useEffect } from "react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { AddWhatsAppWebCard } from "./AddWhatsAppWebCard";
import { AutoQRCodeModal } from "./AutoQRCodeModal";
import { InstanceQRModal } from "./InstanceQRModal";
import { ConnectedBanner } from "./ConnectedBanner";

export const WhatsAppWebSection = () => {
  console.log('[WhatsAppWebSection] Rendering section');
  
  const [qrModalInstanceId, setQrModalInstanceId] = useState<string | null>(null);
  const [hasShownToast, setHasShownToast] = useState(false);
  
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

  // Reset toast flag when no connected instances
  useEffect(() => {
    if (connectedInstances.length === 0) {
      setHasShownToast(false);
    }
  }, [connectedInstances.length]);

  // Show toast when instances become connected
  useEffect(() => {
    if (connectedInstances.length > 0 && !hasShownToast) {
      setHasShownToast(true);
    }
  }, [connectedInstances.length, hasShownToast]);

  const handleOpenQRModal = (instanceId: string) => {
    setQrModalInstanceId(instanceId);
  };

  const handleCloseQRModal = () => {
    setQrModalInstanceId(null);
  };

  const handleCreateInstance = async (instanceName: string) => {
    // The createInstance function from the hook doesn't expect arguments
    // It handles the auto-connection flow internally
    await createInstance();
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
        <ConnectedBanner 
          status="open" 
          shouldShowToast={!hasShownToast}
        />
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

      <AddWhatsAppWebCard 
        onAdd={handleCreateInstance}
        isCreating={loading}
      />

      <AutoQRCodeModal
        isOpen={autoConnectState.showQRModal}
        onOpenChange={closeQRModal}
        qrCode={instances.find(i => i.id === autoConnectState.activeInstanceId)?.qr_code || null}
        isLoading={loading}
        onRefresh={() => {
          if (autoConnectState.activeInstanceId) {
            refreshQRCode(autoConnectState.activeInstanceId);
          }
        }}
      />

      {qrModalInstanceId && (
        <InstanceQRModal
          showQR={!!qrModalInstanceId}
          onOpenChange={handleCloseQRModal}
          instance={instances.find(i => i.id === qrModalInstanceId)}
          isRefreshing={loading}
          onRefreshQR={async () => {
            if (qrModalInstanceId) {
              await refreshQRCode(qrModalInstanceId);
            }
          }}
        />
      )}
    </div>
  );
};
