
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";
import { WhatsAppInstanceCard } from "./WhatsAppInstanceCard";
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2 } from "lucide-react";

export function WhatsAppSettings() {
  const {
    instances,
    isLoading,
    isConnecting,
    createInstance,
    deleteInstance,
    
    // QR Modal state
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    closeQRModal
  } = useWhatsAppWebInstances();

  console.log('[WhatsApp Settings] 🎛️ Renderizando:', { 
    instanceCount: instances.length, 
    isLoading, 
    isConnecting,
    showQRModal,
    hasQRCode: !!selectedQRCode 
  });

  const handleConnect = async () => {
    console.log('[WhatsApp Settings] 🔗 Iniciando conexão...');
    
    const instanceName = `whatsapp_${Date.now()}`;
    try {
      await createInstance(instanceName);
      console.log('[WhatsApp Settings] ✅ Conexão iniciada com sucesso');
    } catch (error) {
      console.error('[WhatsApp Settings] ❌ Erro na conexão:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando instâncias WhatsApp...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            WhatsApp Web.js
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {instances.length === 0 ? (
            <ConnectWhatsAppButton 
              onConnect={handleConnect}
              isConnecting={isConnecting}
            />
          ) : (
            <>
              <div className="grid gap-4">
                {instances.map((instance) => (
                  <WhatsAppInstanceCard
                    key={instance.id}
                    instance={instance}
                    onDelete={() => deleteInstance(instance.id)}
                  />
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <ConnectWhatsAppButton 
                  onConnect={handleConnect}
                  isConnecting={isConnecting}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <ImprovedQRCodeModal
        isOpen={showQRModal}
        onOpenChange={closeQRModal}
        qrCodeUrl={selectedQRCode}
        instanceName={selectedInstanceName}
      />
    </>
  );
}
