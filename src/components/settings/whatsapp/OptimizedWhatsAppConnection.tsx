
import { useWhatsAppWebSectionLogic } from "@/hooks/whatsapp/useWhatsAppWebSectionLogic";
import { ImprovedConnectWhatsAppButton } from "./ImprovedConnectWhatsAppButton";
import { WhatsAppWebInstanceCard } from "./WhatsAppWebInstanceCard";
import { AutoQRModal } from "./AutoQRModal";
import { ChatImportStatusCard } from "./ChatImportStatusCard";
import { ChatImportDialog } from "./ChatImportDialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export const OptimizedWhatsAppConnection = () => {
  const {
    instances,
    isLoading,
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
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-xl mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão de Conectar com Sistema Direto */}
      <div className="flex justify-center">
        <ImprovedConnectWhatsAppButton 
          onConnect={handleConnect}
          isConnecting={isConnectingOrPolling}
        />
      </div>

      {/* Lista de Instâncias */}
      {instances.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Suas Instâncias ({instances.length})
            </h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {instances.map((instance) => (
              <div key={instance.id} className="space-y-4">
                {/* Card da Instância */}
                <WhatsAppWebInstanceCard
                  instance={instance}
                  onDelete={handleDeleteInstance}
                  onRefreshQR={handleRefreshQR}
                  onShowQR={() => handleShowQR(instance)}
                />

                {/* Card de Importação de Chats */}
                <ChatImportStatusCard instance={instance} />

                {/* Botão de Configuração Avançada */}
                <div className="flex justify-center">
                  <ChatImportDialog 
                    instance={instance}
                    trigger={
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Configuração Avançada
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {instances.length === 0 && (
        <div className="text-center py-8">
          <div className="bg-gray-50/80 rounded-2xl p-8">
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              Nenhuma instância conectada
            </h4>
            <p className="text-gray-500 mb-6">
              Conecte sua primeira instância WhatsApp para começar a gerenciar conversas
            </p>
            <ImprovedConnectWhatsAppButton 
              onConnect={handleConnect}
              isConnecting={isConnectingOrPolling}
            />
          </div>
        </div>
      )}

      {/* Modal QR Automático - SÓ ABRE QUANDO NECESSÁRIO */}
      <AutoQRModal
        isOpen={localShowQRModal}
        onClose={closeQRModal}
        qrCode={localSelectedQRCode}
        instanceName={localSelectedInstanceName}
        isWaiting={isWaitingForQR}
        currentAttempt={currentAttempt}
        maxAttempts={maxAttempts}
        error={null}
        onRetry={() => {}}
      />

      {/* Card informativo sobre FASE 2 - Sistema Direto */}
      <div className="bg-blue-50/80 rounded-2xl p-6 border border-blue-200/50">
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>✅ FASE 2 - SISTEMA DIRETO IMPLEMENTADO:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>❌ Health Check Removido:</strong> Comunicação direta com VPS</li>
            <li><strong>🎯 Nomes Inteligentes:</strong> Baseados no email do usuário</li>
            <li><strong>🔄 Retry Automático:</strong> 3 tentativas com backoff</li>
            <li><strong>📊 Logs Detalhados:</strong> Debug completo por Request ID</li>
            <li><strong>⚡ Criação Rápida:</strong> ~30s timeout direto</li>
            <li><strong>👤 Multi-tenant:</strong> Nomes únicos por usuário</li>
          </ul>
          <div className="mt-3 p-3 bg-white/70 rounded border border-blue-200">
            <p className="font-medium">🚀 Fluxo FASE 2:</p>
            <p>1. Email → Nome Inteligente → Verificar Unicidade → VPS Direto</p>
            <p>2. Exemplo: <code>digitalticlin_gmail_com</code>, <code>digitalticlin_gmail_com_2</code></p>
            <p>3. Sem health check = Criação ~25s mais rápida</p>
          </div>
        </div>
      </div>
    </div>
  );
};
