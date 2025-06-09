
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, QrCode, Smartphone, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface OptimizedQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
  instanceName: string;
  autoStartPolling?: boolean;
  qrCode?: string | null;
  isPolling?: boolean;
  isWaiting?: boolean;
  currentAttempt?: number;
  maxAttempts?: number;
  error?: string | null;
  onRetry?: () => void;
}

export const OptimizedQRModal = ({
  isOpen,
  onClose,
  instanceId,
  instanceName,
  autoStartPolling = false,
  qrCode = null,
  isPolling = false,
  isWaiting = false,
  currentAttempt = 0,
  maxAttempts = 8,
  error = null,
  onRetry
}: OptimizedQRModalProps) => {
  const [hasError, setHasError] = useState(false);
  
  const progressPercentage = maxAttempts > 0 ? (currentAttempt / maxAttempts) * 100 : 0;

  // Reset error state quando modal abre
  useEffect(() => {
    if (isOpen) {
      setHasError(false);
    }
  }, [isOpen]);

  // Detectar erros
  useEffect(() => {
    if (error) {
      setHasError(true);
    }
  }, [error]);

  const handleClose = () => {
    console.log('[Optimized QR Modal] 🧹 HÍBRIDO: Fechando modal');
    onClose();
  };

  const handleRetry = () => {
    console.log('[Optimized QR Modal] 🔄 HÍBRIDO: Retry solicitado');
    setHasError(false);
    if (onRetry) {
      onRetry();
    }
  };

  const renderModalContent = () => {
    // QR Code pronto
    if (qrCode && !hasError) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <img
              src={qrCode}
              alt="QR Code do WhatsApp"
              className="w-64 h-64 object-contain"
            />
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 w-full">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900 mb-2">✅ QR Code pronto!</p>
                <ol className="text-green-700 space-y-1">
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Vá em Menu → Dispositivos conectados</li>
                  <li>3. Toque em "Conectar um dispositivo"</li>
                  <li>4. Escaneie este QR code</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Erro ou timeout
    if (hasError || error) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-64 h-64 bg-red-50 rounded-lg flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-red-900">
                Erro ao gerar QR Code
              </p>
              <p className="text-xs text-red-700">
                {error || 'Tente novamente em alguns minutos'}
              </p>
            </div>
          </div>

          <Button 
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      );
    }

    // Aguardando delay inicial
    if (isWaiting) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-64 h-64 bg-blue-50 rounded-lg flex flex-col items-center justify-center space-y-4">
            <Clock className="h-12 w-12 animate-pulse text-blue-600" />
            <div className="text-center space-y-3">
              <p className="text-sm font-medium text-blue-900">
                Preparando QR Code...
              </p>
              <div className="w-full space-y-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
                </div>
                <p className="text-xs text-blue-700">
                  Instância criada, aguarde...
                </p>
                <p className="text-xs text-blue-600">
                  Sistema híbrido em funcionamento
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Polling em andamento
    if (isPolling) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-64 h-64 bg-blue-50 rounded-lg flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="text-center space-y-3">
              <p className="text-sm font-medium text-blue-900">
                Gerando QR Code...
              </p>
              <div className="w-full space-y-2">
                <Progress value={progressPercentage} className="w-full" />
                <p className="text-xs text-blue-700">
                  Tentativa {currentAttempt} de {maxAttempts}
                </p>
                <p className="text-xs text-blue-600">
                  Sistema híbrido ativo
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Estado inicial
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-64 h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center space-y-4">
          <QrCode className="h-12 w-12 text-gray-400" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Preparando...
            </p>
            <p className="text-xs text-gray-500">
              Sistema híbrido iniciado
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-green-600" />
            QR Code - {instanceName}
          </DialogTitle>
        </DialogHeader>

        {renderModalContent()}

        <div className="flex gap-3 mt-4">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleClose}
          >
            Fechar
          </Button>
          
          {qrCode && !hasError && (
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Novo QR
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
