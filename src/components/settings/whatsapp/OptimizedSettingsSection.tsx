
import { useAuth } from "@/contexts/AuthContext";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { WhatsAppInstanceGrid } from "./WhatsAppInstanceGrid";
import { AutoQRModal } from "./AutoQRModal";
import { CreateInstanceButton } from "@/modules/whatsapp/instanceCreation/components/CreateInstanceButton";
import { QRCodeModal } from "@/modules/whatsapp/instanceCreation/components/QRCodeModal";

export const OptimizedSettingsSection = () => {
  const { user } = useAuth();

  const {
    instances,
    isLoading,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    retryQRCode,
    qrPollingActive,
    loadInstances
  } = useWhatsAppWebInstances();

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[Settings] 🗑️ Deletando instância:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[Settings] 🔄 Refresh QR:', instanceId);
    await refreshQRCode(instanceId);
  };

  const handleInstanceCreated = async (result: any) => {
    console.log('[Settings] ✅ Instância criada com sucesso:', result);
    await loadInstances();
  };

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-green-50/30 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 animate-pulse text-green-600" />
            <span>Carregando WhatsApp Settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão principal para criar instância usando estrutura modular */}
      <div className="flex justify-center">
        <CreateInstanceButton 
          onSuccess={handleInstanceCreated}
          variant="whatsapp"
          size="lg"
          className="px-8 py-3 text-lg"
        />
      </div>

      {/* Grid de instâncias ou estado vazio */}
      {instances.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Suas Instâncias WhatsApp ({instances.length})
            </h3>
            <CreateInstanceButton 
              onSuccess={handleInstanceCreated}
              variant="outline"
              size="sm"
              className="text-sm"
            />
          </div>
          
          <WhatsAppInstanceGrid 
            instances={instances}
            onDelete={handleDeleteInstance}
            onRefreshQR={handleRefreshQR}
          />
        </div>
      ) : (
        <Card className="border-dashed border-2 border-green-300 bg-green-50/30">
          <CardContent className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-green-600 opacity-50" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Nenhuma instância WhatsApp
            </h3>
            <p className="text-gray-600 mb-6">
              Conecte sua primeira instância para começar a usar o sistema
            </p>
            <CreateInstanceButton 
              onSuccess={handleInstanceCreated}
              variant="whatsapp"
              size="default"
            />
          </CardContent>
        </Card>
      )}

      {/* Modal QR usando estrutura modular */}
      <QRCodeModal />

      {/* Fallback para modal antigo se necessário */}
      <AutoQRModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        qrCode={selectedQRCode}
        instanceName={selectedInstanceName}
        isWaiting={qrPollingActive || (!selectedQRCode && showQRModal)}
        currentAttempt={0}
        maxAttempts={15}
        error={null}
        onRetry={retryQRCode}
      />

      {/* Card informativo sobre integração modular */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>✅ ESTRUTURA MODULAR INTEGRADA:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>CreateInstanceButton:</strong> Componente modular para criação</li>
              <li><strong>useInstanceCreation:</strong> Hook isolado para lógica de criação</li>
              <li><strong>QRCodeModal:</strong> Modal modular para QR codes</li>
              <li><strong>Edge Functions:</strong> whatsapp_instance_manager integrado</li>
              <li><strong>Compatibilidade:</strong> Mantém funcionalidades existentes</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-blue-200">
              <p className="font-medium">🎯 Fluxo Modular Ativo:</p>
              <p>1. CreateInstanceButton → useInstanceCreation</p>
              <p>2. Edge Function → whatsapp_instance_manager</p>
              <p>3. QRCodeModal → Exibição automática</p>
              <p>4. Sincronização → Webhook + Realtime</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
