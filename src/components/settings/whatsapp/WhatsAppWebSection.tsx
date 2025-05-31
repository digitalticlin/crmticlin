
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, Smartphone, ArrowRight } from "lucide-react";
import { useSimpleWhatsAppConnection } from "@/hooks/whatsapp/useSimpleWhatsAppConnection";
import { SimpleQRCodeModal } from "./SimpleQRCodeModal";
import { CreationLoadingModal } from "./CreationLoadingModal";
import { ConnectedInstanceCard } from "./ConnectedInstanceCard";

export function WhatsAppWebSection() {
  const {
    quickConnect,
    showQRModal,
    showLoadingModal,
    currentQRCode,
    closeQRModal,
    handleCancelCreation,
    isConnecting,
    currentStep,
    retryCount,
    maxRetries,
    hasConnectedInstances,
    connectedInstances,
    instances,
    isLoading,
    error,
    companyId,
    deleteInstance
  } = useSimpleWhatsAppConnection();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </CardContent>
      </Card>
    );
  }

  // Se não tem companyId depois de carregar, mostrar mensagem
  if (!companyId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Empresa não encontrada</h3>
          <p className="text-muted-foreground">
            Configure os dados da sua empresa primeiro na aba Perfil
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-600" />
            <CardTitle>WhatsApp</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Conecte seu WhatsApp para começar a receber e enviar mensagens
          </p>
        </CardHeader>
      </Card>

      {/* Botão principal de conexão */}
      {!hasConnectedInstances && (
        <Card className="border-2 border-dashed border-green-200 bg-green-50/30">
          <CardContent className="text-center py-12">
            <div className="max-w-md mx-auto space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Wifi className="h-3 w-3 text-white" />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-green-900 mb-2">
                  Conectar WhatsApp
                </h3>
                <p className="text-green-700 text-sm">
                  Escaneie um QR Code para conectar seu WhatsApp e começar a usar o sistema
                </p>
              </div>
              
              <Button
                onClick={quickConnect}
                disabled={isConnecting}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-base"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Preparando...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-5 w-5 mr-2" />
                    Conectar WhatsApp
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instâncias conectadas */}
      {hasConnectedInstances && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">WhatsApp Conectado</h3>
            <Button
              onClick={quickConnect}
              disabled={isConnecting}
              variant="outline"
              size="sm"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Conectar Outro
            </Button>
          </div>
          
          <div className="grid gap-4">
            {connectedInstances.map((instance) => (
              <ConnectedInstanceCard
                key={instance.id}
                instance={instance}
                onDelete={deleteInstance}
              />
            ))}
          </div>
        </div>
      )}

      {/* Instâncias aguardando conexão */}
      {instances.some(i => i.web_status === 'waiting_scan' || i.web_status === 'connecting') && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="animate-pulse w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Aguardando conexão...
                </p>
                <p className="text-xs text-yellow-700">
                  Escaneie o QR Code no seu WhatsApp para finalizar a conexão
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem de erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Loading */}
      <CreationLoadingModal
        isOpen={showLoadingModal}
        onClose={() => {}} // Não permitir fechar clicando fora
        onCancel={handleCancelCreation}
        currentStep={currentStep}
        retryCount={retryCount}
        maxRetries={maxRetries}
      />

      {/* Modal QR Code */}
      <SimpleQRCodeModal
        isOpen={showQRModal}
        onClose={closeQRModal}
        qrCodeUrl={currentQRCode}
      />
    </div>
  );
}
