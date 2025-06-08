
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, QrCode, Smartphone, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useIntelligentQRPolling } from "@/hooks/whatsapp/useIntelligentQRPolling";

interface OptimizedQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
  instanceName: string;
  autoStartPolling?: boolean;
}

export const OptimizedQRModal = ({
  isOpen,
  onClose,
  instanceId,
  instanceName,
  autoStartPolling = false
}: OptimizedQRModalProps) => {
  const [manualRefreshMode, setManualRefreshMode] = useState(false);
  
  const {
    isPolling,
    currentAttempt,
    qrCode,
    error,
    timedOut,
    isWaiting,
    startPolling,
    stopPolling,
    reset
  } = useIntelligentQRPolling();

  const maxAttempts = 8;
  const progressPercentage = (currentAttempt / maxAttempts) * 100;

  // Auto-start polling se solicitado (após criação de instância)
  useEffect(() => {
    if (isOpen && autoStartPolling && instanceId && !isPolling && !qrCode && !isWaiting) {
      console.log('[Optimized QR Modal] 🚀 Auto-iniciando polling após criação');
      handleStartPolling();
    }
  }, [isOpen, autoStartPolling, instanceId, isPolling, qrCode, isWaiting]);

  // Cleanup ao fechar modal
  useEffect(() => {
    if (!isOpen) {
      console.log('[Optimized QR Modal] 🧹 Modal fechado - limpando polling');
      stopPolling('modal fechado');
      reset();
      setManualRefreshMode(false);
    }
  }, [isOpen, stopPolling, reset]);

  const handleStartPolling = async () => {
    console.log(`[Optimized QR Modal] 🔄 Iniciando polling para: ${instanceName}`);
    setManualRefreshMode(false);
    
    await startPolling(instanceId, {
      maxAttempts: 8,
      timeoutMs: 120000, // 2 minutos máximo
      intervalMs: 4000,  // 4 segundos entre tentativas
      initialDelayMs: 4000, // 4 segundos de delay inicial
      progressCallback: (current, max) => {
        console.log(`[Optimized QR Modal] 📊 Progresso: ${current}/${max}`);
      },
      successCallback: (qrCode) => {
        console.log(`[Optimized QR Modal] ✅ QR Code obtido!`);
      },
      errorCallback: (error) => {
        console.log(`[Optimized QR Modal] ❌ Erro no polling:`, error);
        setManualRefreshMode(true);
      },
      timeoutCallback: () => {
        console.log(`[Optimized QR Modal] ⏰ Timeout no polling`);
        setManualRefreshMode(true);
      }
    });
  };

  const handleClose = () => {
    console.log('[Optimized QR Modal] 🧹 Fechando modal e parando polling');
    stopPolling('usuário fechou modal');
    reset();
    onClose();
  };

  const handleRetry = () => {
    console.log('[Optimized QR Modal] 🔄 Retry manual solicitado');
    reset();
    handleStartPolling();
  };

  const renderModalContent = () => {
    // QR Code pronto
    if (qrCode) {
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
    if (error || timedOut) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-64 h-64 bg-red-50 rounded-lg flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-red-900">
                {timedOut ? 'Timeout' : 'Erro ao gerar QR Code'}
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

    // Aguardando delay inicial (nova feature)
    if (isWaiting) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-64 h-64 bg-blue-50 rounded-lg flex flex-col items-center justify-center space-y-4">
            <Clock className="h-12 w-12 animate-pulse text-blue-600" />
            <div className="text-center space-y-3">
              <p className="text-sm font-medium text-blue-900">
                Aguardando VPS processar...
              </p>
              <div className="w-full space-y-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
                </div>
                <p className="text-xs text-blue-700">
                  Instância criada, preparando QR Code
                </p>
                <p className="text-xs text-blue-600">
                  Aguarde 4 segundos para a VPS processar
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => stopPolling('usuário cancelou')}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Cancelar
          </Button>
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
                  Aguarde enquanto a VPS gera o QR Code
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => stopPolling('usuário cancelou')}
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Cancelar
          </Button>
        </div>
      );
    }

    // Estado inicial ou modo manual
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="w-64 h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center space-y-4">
          <QrCode className="h-12 w-12 text-gray-400" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-700">
              QR Code não disponível
            </p>
            <p className="text-xs text-gray-500">
              {manualRefreshMode ? 'Clique em "Gerar QR Code" para tentar novamente' : 'Clique para gerar o QR Code'}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 w-full">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Como conectar:</p>
              <p className="text-blue-700 text-xs">
                O QR Code será gerado automaticamente. Escaneie com seu WhatsApp para conectar.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleStartPolling}
          className="bg-green-600 hover:bg-green-700 w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Gerar QR Code
        </Button>
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
          
          {qrCode && (
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
