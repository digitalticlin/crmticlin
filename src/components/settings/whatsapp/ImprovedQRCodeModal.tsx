
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, QrCode, CheckCircle, RefreshCw } from "lucide-react";
import { QRCodeDisplay } from "./modal/QRCodeDisplay";

interface ImprovedQRCodeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeUrl: string | null;
  instanceName: string;
  isWaitingForQR?: boolean;
  currentAttempt?: number;
  maxAttempts?: number;
}

export const ImprovedQRCodeModal = ({
  isOpen,
  onOpenChange,
  qrCodeUrl,
  instanceName,
  isWaitingForQR = false,
  currentAttempt = 0,
  maxAttempts = 20
}: ImprovedQRCodeModalProps) => {
  const [isExpired, setIsExpired] = useState(false);
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  // FASE 3.0: Reset estado ao abrir/fechar
  useEffect(() => {
    setIsExpired(false);
    
    // Limpar timeout anterior se existir
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Configurar novo timeout apenas se o modal estiver aberto e tiver QR
    if (isOpen && qrCodeUrl && !isWaitingForQR) {
      const id = window.setTimeout(() => {
        setIsExpired(true);
      }, 5 * 60 * 1000); // 5 minutos
      
      setTimeoutId(Number(id));
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isOpen, qrCodeUrl, isWaitingForQR]);

  // Função para lidar com QR expirado
  const handleExpired = () => {
    setIsExpired(true);
  };

  const formatInstanceName = (name: string) => {
    return name.length > 30 ? name.substring(0, 27) + "..." : name;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5 text-green-600" />
            <div className="flex flex-col">
              <span>Conectar WhatsApp</span>
              {instanceName && (
                <span className="text-sm font-normal text-muted-foreground">
                  {formatInstanceName(instanceName)}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-2">
          <QRCodeDisplay
            qrCodeUrl={qrCodeUrl}
            isWaitingForQR={isWaitingForQR}
            currentAttempt={currentAttempt}
            maxAttempts={maxAttempts}
            isExpired={isExpired}
            onExpired={handleExpired}
            isOpen={isOpen}
          />

          {/* FASE 3.0: Melhor feedback visual e ajuda */}
          <div className="mt-4 w-full">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground mt-4">
            Problemas? Entre em contato com o suporte ou tente criar uma nova instância.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
