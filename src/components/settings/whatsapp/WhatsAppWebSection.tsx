
import { ManualWhatsAppInstanceCreator } from "./ManualWhatsAppInstanceCreator";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";

export const WhatsAppWebSection = () => {
  const {
    instances,
    isLoading,
    deleteInstance,
    refreshQRCode,
    refetch
  } = useWhatsAppWebInstances();

  console.log('[WhatsApp Web Section] 🎯 PRODUÇÃO - Fluxo Manual:', {
    instancesCount: instances.length,
    isLoading
  });

  if (isLoading) {
    return <WhatsAppWebLoadingState />;
  }

  const handleShowQR = (instance: any) => {
    // Para agora, só fazer refresh do QR code
    refreshQRCode(instance.id);
  };

  return (
    <div className="space-y-6">
      {/* Sistema Manual de Criação */}
      <ManualWhatsAppInstanceCreator />

      {/* Lista de Instâncias Existentes */}
      {instances.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Instâncias Existentes</h3>
          <WhatsAppWebInstancesGrid 
            instances={instances}
            onRefreshQR={refreshQRCode}
            onDelete={deleteInstance}
            onShowQR={handleShowQR}
          />
        </div>
      )}
    </div>
  );
};
