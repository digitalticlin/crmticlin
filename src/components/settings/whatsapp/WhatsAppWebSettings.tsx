
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Shield, AlertTriangle } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { WhatsAppWebLoadingState } from "./WhatsAppWebLoadingState";
import { WhatsAppWebEmptyState } from "./WhatsAppWebEmptyState";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { ImprovedConnectWhatsAppButton } from "./ImprovedConnectWhatsAppButton";
import { CleanupOrphanedInstancesButton } from "./CleanupOrphanedInstancesButton";
import { OrphanInstanceManager } from "./OrphanInstanceManager";
import { QRCodeModal } from "./QRCodeModal";

export const WhatsAppWebSettings = () => {
  const {
    instances,
    isLoading,
    isConnecting,
    error,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    refetch,
    createInstance,
    deleteInstance,
    refreshQRCode,
    closeQRModal
  } = useWhatsAppWebInstances();

  const handleConnect = async () => {
    const timestamp = Date.now();
    const instanceName = `whatsapp_${timestamp}`;
    await createInstance(instanceName);
  };

  const handleShowQR = (instance: any) => {
    // Implementação para mostrar QR code modal
  };

  if (isLoading) {
    return <WhatsAppWebLoadingState />;
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/30">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-700">Erro ao carregar instâncias: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com status */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-800">WhatsApp Web.js</h2>
                <p className="text-sm text-green-600">
                  Conecte suas instâncias WhatsApp via Web.js
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-300 text-green-700">
                <Shield className="h-3 w-3 mr-1" />
                Proteção Ativa
              </Badge>
              <Badge variant="secondary">
                {instances.length} instância(s)
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Sistema de Recuperação de Órfãs */}
      <OrphanInstanceManager />

      {/* Botões de ação */}
      <div className="flex gap-3">
        <ImprovedConnectWhatsAppButton 
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />
        <CleanupOrphanedInstancesButton 
          onCleanupComplete={refetch}
        />
      </div>

      {/* Grid de instâncias ou estado vazio */}
      {instances.length > 0 ? (
        <WhatsAppWebInstancesGrid
          instances={instances}
          onRefreshQR={refreshQRCode}
          onDelete={deleteInstance}
          onShowQR={handleShowQR}
        />
      ) : (
        <WhatsAppWebEmptyState
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />
      )}

      {/* Modal do QR Code */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        qrCode={selectedQRCode}
        instanceName={selectedInstanceName}
      />
    </div>
  );
};
