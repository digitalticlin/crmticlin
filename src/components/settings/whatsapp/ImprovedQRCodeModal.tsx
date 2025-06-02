
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Loader2, QrCode, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useQRCodeValidation } from "@/hooks/whatsapp/useQRCodeValidation";
import { useRetryableOperation } from "@/hooks/whatsapp/useRetryableOperation";

interface ImprovedQRCodeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string | null;
  isLoading: boolean;
  onRefresh: () => Promise<string | null>;
}

export function ImprovedQRCodeModal({ 
  isOpen, 
  onOpenChange, 
  qrCode, 
  isLoading,
  onRefresh 
}: ImprovedQRCodeModalProps) {
  const [countdown, setCountdown] = useState(120); // 2 minutos
  const { validateQRCode } = useQRCodeValidation();
  const qrValidation = validateQRCode(qrCode);

  const retryableRefresh = useRetryableOperation(
    onRefresh,
    {
      maxRetries: 3,
      delayMs: 2000,
      backoffMultiplier: 1.5
    }
  );

  // Countdown timer para QR code
  useEffect(() => {
    if (!isOpen || !qrValidation.isValid) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          retryableRefresh.execute();
          return 120; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, qrValidation.isValid, retryableRefresh.execute]);

  // Reset countdown quando QR code muda
  useEffect(() => {
    if (qrValidation.isValid) {
      setCountdown(120);
    }
  }, [qrCode, qrValidation.isValid]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressValue = () => {
    return ((120 - countdown) / 120) * 100;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          {isLoading || retryableRefresh.isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-sm font-medium">
                {retryableRefresh.retryCount > 0 
                  ? `Tentativa ${retryableRefresh.retryCount + 1} - Gerando QR Code...`
                  : "Gerando QR Code..."
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Aguarde enquanto o WhatsApp Web.js é inicializado
              </p>
            </div>
          ) : qrCode && qrValidation.isValid ? (
            <>
              <div className="bg-white p-4 rounded-lg mb-4 border relative">
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
                
                {/* Countdown overlay */}
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(countdown)}
                </div>
              </div>

              {/* Progress bar para countdown */}
              <div className="w-full mb-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>QR Code válido</span>
                  <span>Auto-renovação em {formatTime(countdown)}</span>
                </div>
                <Progress value={getProgressValue()} className="h-2" />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Como conectar:</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>1. Abra o WhatsApp no seu celular</p>
                  <p>2. Vá em Menu → Aparelhos conectados</p>
                  <p>3. Toque em "Conectar um aparelho"</p>
                  <p>4. Escaneie este QR code</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => retryableRefresh.execute()}
                className="mt-4"
                size="sm"
                disabled={retryableRefresh.isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar QR Code
              </Button>
            </>
          ) : qrValidation.isPlaceholder ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-sm font-medium">WhatsApp Web.js inicializando...</p>
              <p className="text-xs text-muted-foreground mt-1">
                {qrValidation.errorMessage}
              </p>
              <Button 
                variant="outline" 
                onClick={() => retryableRefresh.execute()}
                className="mt-4"
                size="sm"
                disabled={retryableRefresh.isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium">Erro ao gerar QR Code</p>
              <p className="text-xs text-muted-foreground mt-1">
                {qrValidation.errorMessage || retryableRefresh.error || 'Tente novamente'}
              </p>
              
              {retryableRefresh.error && (
                <Alert variant="destructive" className="mt-4 text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {retryableRefresh.error}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={() => retryableRefresh.execute()}
                className="mt-4"
                size="sm"
                disabled={retryableRefresh.isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {retryableRefresh.isLoading ? 'Gerando...' : 'Gerar QR Code'}
              </Button>
            </div>
          )}
        </div>

        {retryableRefresh.error && retryableRefresh.canRetry && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">Houve um problema. Tentar novamente?</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => retryableRefresh.reset()}
              >
                Reset
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)}
          className="w-full"
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
