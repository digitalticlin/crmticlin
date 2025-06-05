
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ImprovedQRCodeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeUrl: string | null;
  instanceName: string;
  isWaitingForQR?: boolean;
  currentAttempt?: number;
  maxAttempts?: number;
}

export function ImprovedQRCodeModal({ 
  isOpen, 
  onOpenChange, 
  qrCodeUrl, 
  instanceName,
  isWaitingForQR = false,
  currentAttempt = 0,
  maxAttempts = 20
}: ImprovedQRCodeModalProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [isExpired, setIsExpired] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    
    setTimeLeft(300);
    setIsExpired(false);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    console.log('[QR Modal] 🔐 Fechando modal otimizado');
    onOpenChange(false);
  };

  // Calculate progress percentage
  const progressPercentage = maxAttempts > 0 ? Math.min((currentAttempt / maxAttempts) * 100, 100) : 0;

  console.log('[QR Modal] 📱 Renderizando modal OTIMIZADO:', { 
    isOpen, 
    hasQR: !!qrCodeUrl, 
    instanceName,
    timeLeft,
    isExpired,
    isWaitingForQR,
    currentAttempt,
    maxAttempts
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-green-600" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            {isWaitingForQR 
              ? `Preparando QR Code para a instância "${instanceName}"...`
              : `Escaneie o QR Code para conectar sua conta WhatsApp à instância "${instanceName}"`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          {/* ESTADO: Aguardando QR Code */}
          {isWaitingForQR && !qrCodeUrl ? (
            <>
              <div className="bg-blue-50 p-8 rounded-lg border-2 border-blue-200 mb-4 flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <div className="text-center">
                  <h3 className="font-medium text-blue-900 mb-2">Preparando QR Code...</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Tentativa {currentAttempt} de {maxAttempts}
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-48 bg-blue-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-blue-600">
                    Estimativa: {Math.max(0, (maxAttempts - currentAttempt) * 2)}s restantes
                  </p>
                </div>
              </div>
            </>
          ) : qrCodeUrl && !isExpired ? (
            /* ESTADO: QR Code disponível */
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-green-200 mb-4">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code para conexão do WhatsApp" 
                  className="w-64 h-64 object-contain"
                />
              </div>
              
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    QR Code válido por: {formatTime(timeLeft)}
                  </span>
                </div>
                {currentAttempt > 0 && (
                  <p className="text-xs text-green-600 mb-1">
                    ✅ Obtido na tentativa {currentAttempt} (otimizado!)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  O código expira automaticamente por segurança
                </p>
              </div>
            </>
          ) : isExpired ? (
            /* ESTADO: QR Code expirado */
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-orange-500" />
              <h3 className="font-medium text-orange-700 mb-2">QR Code Expirado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                O QR Code expirou por segurança. Feche este modal e tente criar uma nova instância.
              </p>
            </div>
          ) : (
            /* ESTADO: QR Code indisponível */
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
              <h3 className="font-medium text-red-700 mb-2">QR Code Indisponível</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Não foi possível obter o QR Code. Tente novamente.
              </p>
            </div>
          )}
          
          {/* Instruções (apenas quando QR Code estiver disponível) */}
          {qrCodeUrl && !isExpired && !isWaitingForQR && (
            <div className="bg-blue-50 p-4 rounded-lg w-full">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Como conectar:</p>
                  <ol className="text-blue-700 space-y-1 text-xs">
                    <li>1. Abra o WhatsApp no seu celular</li>
                    <li>2. Vá em ⚙️ <strong>Configurações</strong></li>
                    <li>3. Toque em <strong>Aparelhos conectados</strong></li>
                    <li>4. Toque em <strong>Conectar um aparelho</strong></li>
                    <li>5. Escaneie este QR Code</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full"
          >
            {isExpired ? 'Fechar e Tentar Novamente' : 'Fechar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
