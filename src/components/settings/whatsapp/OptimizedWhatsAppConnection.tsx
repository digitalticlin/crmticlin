
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
      {/* Botão de Conectar com Sistema Robusto */}
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

      {/* Card informativo sobre sistema robusto */}
      <div className="bg-green-50/80 rounded-2xl p-6 border border-green-200/50">
        <div className="text-sm text-green-800 space-y-2">
          <p><strong>✅ SISTEMA ROBUSTO IMPLEMENTADO:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Health Check VPS:</strong> Verifica saúde antes da criação</li>
            <li><strong>Retry Automático:</strong> 3 tentativas com backoff exponencial</li>
            <li><strong>Logs Estruturados:</strong> Debug detalhado por etapa</li>
            <li><strong>UX Corrigida:</strong> Modal só abre quando necessário</li>
            <li><strong>Timeout Inteligente:</strong> 90s com feedback visual</li>
            <li><strong>Erro Específico:</strong> Mensagens claras por tipo de falha</li>
          </ul>
          <div className="mt-3 p-3 bg-white/70 rounded border border-green-200">
            <p className="font-medium">🎯 Fluxo Robusto:</p>
            <p>1. Health Check → Retry Logic → Criação → Feedback</p>
            <p>2. Modal abre apenas via "Gerar QR Code" manual</p>
            <p>3. Sistema resistente a timeout e instabilidade VPS</p>
          </div>
        </div>
      </div>
    </div>
  );
};
