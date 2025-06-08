
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
  onRefreshQRCode: (instanceId: string) => Promise<{ qrCode?: string; success?: boolean } | null>;
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
  const [pollingProgress, setPollingProgress] = useState({ current: 0, max: 15 });
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

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
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  const startAggressivePolling = async () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }

    console.log(`[QR Polling] 🚀 Iniciando polling agressivo para: ${instanceName}`);
    setIsPolling(true);
    setPollingProgress({ current: 0, max: 15 });

    let attempt = 0;
    
    const poll = async () => {
      attempt++;
      setPollingProgress({ current: attempt, max: 15 });
      
      console.log(`[QR Polling] 📱 Tentativa ${attempt}/15 para ${instanceName}`);
      
      try {
        const result = await onRefreshQRCode(instanceId);
        
        if (result?.success && result.qrCode) {
          console.log(`[QR Polling] ✅ QR Code obtido na tentativa ${attempt}`);
          setCurrentQRCode(result.qrCode);
          setIsPolling(false);
          if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
          }
          toast.success(`QR Code obtido após ${attempt} tentativas!`);
          return;
        }

        if (attempt >= 15) {
          console.warn(`[QR Polling] ⏰ Timeout após 15 tentativas`);
          setIsPolling(false);
          if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
          }
          toast.warning('QR Code não foi gerado no tempo esperado. Tente gerar um novo.');
        }

      } catch (error: any) {
        console.error(`[QR Polling] ❌ Erro na tentativa ${attempt}:`, error);
        
        if (attempt >= 15) {
          setIsPolling(false);
          if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
          }
          toast.error(`Erro após 15 tentativas: ${error.message}`);
        }
      }
    };

    // Primeira tentativa imediata
    await poll();
    
    // Continuar polling a cada 2 segundos se não obteve sucesso
    if (attempt < 15 && !currentQRCode) {
      const intervalId = setInterval(poll, 2000);
      setPollingIntervalId(intervalId);
    }
  };

  const handleGenerateNewQR = async () => {
    setCurrentQRCode(null);
    await startAggressivePolling();
  };

  const handleClose = () => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    setIsPolling(false);
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
                    Buscando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar novo QR Code
                  </>
                )}
              </Button>
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
