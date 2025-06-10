
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";
import { WhatsAppInstanceGrid } from "./WhatsAppInstanceGrid";
import { AutoQRModal } from "./AutoQRModal";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, CheckCircle } from "lucide-react";

export const WhatsAppWebSection = () => {
  const { user } = useAuth();
  const {
    instances,
    isLoading,
    isConnecting,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    createInstance,
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    retryQRCode
  } = useWhatsAppWebInstances();

  const handleConnect = async () => {
    if (!user?.email) {
      console.error('[WhatsApp Section] ❌ Email do usuário não disponível');
      return;
    }

    console.log('[WhatsApp Section] 🚀 HÍBRIDO: Iniciando criação via método híbrido:', user.email);
    await createInstance(user.email);
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[WhatsApp Section] 🗑️ HÍBRIDO: Deletando via método híbrido:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsApp Section] 🔄 HÍBRIDO: Refresh QR via método híbrido:', instanceId);
    await refreshQRCode(instanceId);
  };

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-green-50/30 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 animate-pulse text-green-600" />
            <span>Carregando configurações WhatsApp...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasInstances = instances.length > 0;

  return (
    <div className="space-y-6">
      {!hasInstances ? (
        <ConnectWhatsAppButton 
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Suas Instâncias WhatsApp ({instances.length})
            </h3>
            <ConnectWhatsAppButton 
              onConnect={handleConnect}
              isConnecting={isConnecting}
            />
          </div>
          
          <WhatsAppInstanceGrid 
            instances={instances}
            onDelete={handleDeleteInstance}
            onRefreshQR={handleRefreshQR}
          />
        </div>
      )}

      <AutoQRModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        qrCode={selectedQRCode}
        instanceName={selectedInstanceName}
        isWaiting={!selectedQRCode}
        currentAttempt={0}
        maxAttempts={15}
        error={null}
        onRetry={retryQRCode}
      />
      
      {/* Card informativo sobre método híbrido */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-blue-800 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <strong>✅ MÉTODO HÍBRIDO ATIVADO</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Prioridade 1:</strong> Edge Function corrigida com configuração do script</li>
              <li><strong>Fallback:</strong> Comunicação direta VPS se Edge Function falhar</li>
              <li><strong>Multi-tenant:</strong> Instâncias isoladas por usuário</li>
              <li><strong>Monitoramento:</strong> Logs detalhados de ambos os métodos</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-blue-200">
              <p className="font-medium">🎯 Fluxo Híbrido:</p>
              <p>1. Tentar Edge Function → 2. Se falhar, usar VPS direto → 3. Modal QR automático</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
