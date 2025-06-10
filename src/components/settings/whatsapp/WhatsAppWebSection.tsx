
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

  // CORREÇÃO FINAL: Criar instância APENAS via ApiClient
  const handleConnect = async () => {
    if (!user?.email) {
      console.error('[WhatsApp Section] ❌ CORREÇÃO FINAL: Email do usuário não disponível');
      return;
    }

    console.log('[WhatsApp Section] 🚀 CORREÇÃO FINAL: Iniciando criação via ApiClient apenas:', user.email);
    await createInstance(); // CORREÇÃO FINAL: vai usar ApiClient apenas
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[WhatsApp Section] 🗑️ CORREÇÃO FINAL: Deletando via ApiClient apenas:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsApp Section] 🔄 CORREÇÃO FINAL: Refresh QR via ApiClient apenas:', instanceId);
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
      
      {/* Card informativo sobre correção aplicada */}
      <Card className="border-green-200 bg-green-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-green-800 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <strong>✅ CORREÇÃO FINAL - API CLIENT IMPLEMENTADO</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Chamadas Diretas VPS:</strong> ❌ REMOVIDAS do frontend</li>
              <li><strong>ApiClient Centralizado:</strong> ✅ Todos os métodos implementados</li>
              <li><strong>Edge Function Única:</strong> whatsapp_instance_manager apenas</li>
              <li><strong>Fluxo Corrigido:</strong> Frontend → ApiClient → Edge Function → VPS</li>
              <li><strong>Logs Limpos:</strong> ❌ Sem mais "[DIRECT_VPS]" no frontend</li>
              <li><strong>Nomes Inteligentes:</strong> ✅ Gerados baseados no email do usuário</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-green-200">
              <p className="font-medium">🎯 Fluxo CORRIGIDO FINAL:</p>
              <p>1. Frontend chama ApiClient → 2. ApiClient chama Edge Function → 3. Edge Function comunica com VPS → 4. Resposta via Edge Function</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
