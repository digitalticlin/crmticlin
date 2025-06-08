
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string;
  instanceId: string;
  onRefreshQRCode: (instanceId: string) => Promise<{ qrCode?: string; success?: boolean; waiting?: boolean } | null>;
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
  const [pollingProgress, setPollingProgress] = useState({ current: 0, max: 8 });
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentQRCode(qrCode);
  }, [qrCode]);

  // CORREÇÃO: Polling controlado apenas quando modal abre SEM QR Code
  useEffect(() => {
    if (isOpen && isWaitingForQR && !currentQRCode && !isPolling) {
      console.log(`[QR Modal] 🎯 Iniciando polling controlado para: ${instanceName}`);
      startControlledPolling();
    }
    
    // Limpar polling ao fechar modal
    if (!isOpen && pollingIntervalId) {
      console.log(`[QR Modal] 🛑 Modal fechado - parando polling`);
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
      setIsPolling(false);
    }
  }, [isOpen, isWaitingForQR, currentQRCode, isPolling]);

  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  const startControlledPolling = async () => {
    if (pollingIntervalId) {
      console.log(`[QR Modal] ⚠️ Polling já ativo - cancelando novo`);
      return;
    }

    console.log(`[QR Modal] 🚀 Polling controlado v3.0 para: ${instanceName}`);
    setIsPolling(true);
    setPollingProgress({ current: 0, max: 8 }); // Reduzido para 8 tentativas

    let attempt = 0;
    
    const poll = async () => {
      attempt++;
      setPollingProgress({ current: attempt, max: 8 });
      
      console.log(`[QR Modal] 📱 Tentativa ${attempt}/8 para ${instanceName}`);
      
      try {
        const result = await onRefreshQRCode(instanceId);
        
        if (result?.success && result.qrCode) {
          console.log(`[QR Modal] ✅ QR Code obtido na tentativa ${attempt}`);
          setCurrentQRCode(result.qrCode);
          stopPolling();
          toast.success(`QR Code gerado com sucesso!`);
          return;
        }

        if (attempt >= 8) {
          console.log(`[QR Modal] ⏰ Timeout após 8 tentativas`);
          stopPolling();
          toast.warning('QR Code não foi gerado. Tente novamente em alguns minutos.');
        }

      } catch (error: any) {
        console.error(`[QR Modal] ❌ Erro na tentativa ${attempt}:`, error);
        
        if (attempt >= 8) {
          stopPolling();
          toast.error(`Erro após ${attempt} tentativas: ${error.message}`);
        }
      }
    };

    // Primeira tentativa imediata
    await poll();
    
    // Continuar polling apenas se necessário
    if (attempt < 8 && !currentQRCode && isOpen) {
      const intervalId = setInterval(poll, 4000); // 4 segundos entre tentativas
      setPollingIntervalId(intervalId);
    }
  };

  const stopPolling = () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    setIsPolling(false);
    console.log(`[QR Modal] 🛑 Polling parado`);
  };

  const handleGenerateNewQR = async () => {
    console.log(`[QR Modal] 🔄 Geração manual para: ${instanceName}`);
    
    // Parar polling existente
    stopPolling();
    
    setCurrentQRCode(null);
    setIsPolling(true);
    
    try {
      const result = await onRefreshQRCode(instanceId);
      
      if (result?.success && result.qrCode) {
        setCurrentQRCode(result.qrCode);
        toast.success(`QR Code gerado manualmente!`);
      } else {
        toast.warning('QR Code não disponível. Aguarde alguns segundos.');
        // Iniciar polling controlado após tentativa manual
        setTimeout(() => startControlledPolling(), 2000);
      }
    } catch (error: any) {
      console.error('[QR Modal] ❌ Erro na geração manual:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsPolling(false);
    }
  };

  const handleClose = () => {
    console.log(`[QR Modal] 🧹 Fechando modal e parando polling`);
    stopPolling();
    setCurrentQRCode(null);
    onClose();
  };

  const progressPercentage = (pollingProgress.current / pollingProgress.max) * 100;

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
                  <Progress value={progressPercentage} className="w-full" />
                  <p className="text-xs text-center text-gray-500">
                    Tentativa {pollingProgress.current} de {pollingProgress.max}
                  </p>
                  <p className="text-xs text-center text-gray-400">
                    Aguarde enquanto a VPS gera o QR Code
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
              
              <Button
                onClick={handleGenerateNewQR}
                disabled={isPolling}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPolling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            </div>
          )}

          {currentQRCode && (
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                ✅ QR Code pronto! Escaneie com seu WhatsApp.
              </p>
              <p className="text-xs text-gray-500">
                O QR Code expira em alguns minutos.
              </p>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleClose}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
