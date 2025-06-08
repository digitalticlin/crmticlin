
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";
import { AggressiveQRPolling } from "@/services/whatsapp/aggressiveQRPolling";
import { VPSWebhookService } from "@/services/whatsapp/vpsWebhookService";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string;
  instanceId: string;
  onRefreshQRCode: (instanceId: string) => Promise<{ qrCode?: string } | null>;
  isWaitingForQR?: boolean;
}

export const QRCodeModal = ({
  isOpen,
  onClose,
  qrCode,
  instanceName,
  instanceId,
  onRefreshQRCode,
  isWaitingForQR = false
}: QRCodeModalProps) => {
  const [currentQRCode, setCurrentQRCode] = useState<string | null>(qrCode);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState({ current: 0, max: 15, percentage: 0 });
  const [aggressivePolling, setAggressivePolling] = useState<AggressiveQRPolling | null>(null);
  const [isConfiguringWebhook, setIsConfiguringWebhook] = useState(false);

  useEffect(() => {
    setCurrentQRCode(qrCode);
  }, [qrCode]);

  useEffect(() => {
    if (isOpen && isWaitingForQR && !currentQRCode) {
      startAggressivePolling();
    }
  }, [isOpen, isWaitingForQR, currentQRCode]);

  useEffect(() => {
    return () => {
      if (aggressivePolling) {
        aggressivePolling.stop();
      }
    };
  }, [aggressivePolling]);

  const startAggressivePolling = () => {
    if (aggressivePolling) {
      aggressivePolling.stop();
    }

    console.log('[QR Modal] 🚀 Iniciando polling agressivo...');
    setIsPolling(true);

    const polling = new AggressiveQRPolling(
      instanceId,
      instanceName,
      onRefreshQRCode,
      (qrCode) => {
        console.log('[QR Modal] ✅ QR Code recebido via polling agressivo');
        setCurrentQRCode(qrCode);
        setIsPolling(false);
      },
      () => {
        console.log('[QR Modal] ⏰ Timeout do polling agressivo');
        setIsPolling(false);
        toast.warning('QR Code não foi gerado no tempo esperado. Tente configurar o webhook.');
      }
    );

    // Atualizar progresso a cada segundo
    const progressInterval = setInterval(() => {
      if (polling) {
        const progress = polling.getProgress();
        setPollingProgress(progress);
      }
    }, 500);

    // Limpar intervalo quando parar
    setTimeout(() => {
      clearInterval(progressInterval);
    }, 32000); // Um pouco mais que o tempo máximo

    polling.start();
    setAggressivePolling(polling);
  };

  const handleConfigureWebhook = async () => {
    setIsConfiguringWebhook(true);
    
    try {
      console.log('[QR Modal] 🔧 Configurando webhook...');
      
      // Primeiro verificar se a VPS suporta webhooks
      const supportCheck = await VPSWebhookService.checkWebhookSupport();
      console.log('[QR Modal] 📊 Suporte a webhooks:', supportCheck);
      
      if (!supportCheck.supported) {
        toast.warning('VPS não suporta webhooks. Use o polling manual.');
        return;
      }

      // Configurar webhook global
      const globalResult = await VPSWebhookService.configureGlobalWebhook();
      
      if (globalResult.success) {
        toast.success('Webhook configurado com sucesso! Tentando novamente...');
        
        // Aguardar um pouco e tentar buscar QR Code novamente
        setTimeout(() => {
          startAggressivePolling();
        }, 2000);
      } else {
        toast.error(`Erro ao configurar webhook: ${globalResult.message}`);
      }

    } catch (error) {
      console.error('[QR Modal] ❌ Erro ao configurar webhook:', error);
      toast.error(`Erro ao configurar webhook: ${error.message}`);
    } finally {
      setIsConfiguringWebhook(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      console.log('[QR Modal] 🔄 Refresh manual do QR Code...');
      const result = await onRefreshQRCode(instanceId);
      
      if (result?.qrCode) {
        setCurrentQRCode(result.qrCode);
        toast.success('QR Code atualizado manualmente!');
      } else {
        toast.warning('QR Code ainda não disponível');
      }
    } catch (error) {
      console.error('[QR Modal] ❌ Erro no refresh manual:', error);
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
    }
  };

  const handleClose = () => {
    if (aggressivePolling) {
      aggressivePolling.stop();
    }
    setIsPolling(false);
    setCurrentQRCode(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            QR Code - {instanceName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          {currentQRCode ? (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <img
                src={currentQRCode}
                alt="QR Code do WhatsApp"
                className="w-64 h-64 object-contain"
              />
            </div>
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <p className="text-sm text-gray-600 text-center">
                {isPolling ? 'Buscando QR Code...' : 'Aguardando QR Code...'}
              </p>
              
              {isPolling && (
                <div className="w-full space-y-2">
                  <Progress value={pollingProgress.percentage} className="w-full" />
                  <p className="text-xs text-center text-gray-500">
                    Tentativa {pollingProgress.current} de {pollingProgress.max}
                  </p>
                </div>
              )}
            </div>
          )}

          {!currentQRCode && (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Escaneie o QR Code com seu WhatsApp para conectar
              </p>
              
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={startAggressivePolling}
                  disabled={isPolling}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isPolling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Buscar QR Code (Polling Agressivo)
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleConfigureWebhook}
                  disabled={isConfiguringWebhook}
                  variant="outline"
                  size="sm"
                >
                  {isConfiguringWebhook ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar Webhook
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleManualRefresh}
                  variant="ghost"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}

          {currentQRCode && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                ✅ QR Code carregado! Escaneie com seu WhatsApp.
              </p>
              <p className="text-xs text-gray-500">
                O QR Code expira em alguns minutos. Se não funcionar, gere um novo.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
