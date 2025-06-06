
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { useState } from "react";
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

export function ImprovedQRCodeModal({ 
  isOpen, 
  onOpenChange, 
  qrCodeUrl, 
  instanceName,
  isWaitingForQR = false,
  currentAttempt = 0,
  maxAttempts = 20
}: ImprovedQRCodeModalProps) {
  const [isExpired, setIsExpired] = useState(false);

  const handleExpired = () => {
    setIsExpired(true);
  };

  const handleClose = () => {
    console.log('[QR Modal] 🔐 Fechando modal otimizado');
    setIsExpired(false);
    onOpenChange(false);
  };

  console.log('[QR Modal] 📱 Renderizando modal OTIMIZADO:', { 
    isOpen, 
    hasQR: !!qrCodeUrl, 
    instanceName,
    isExpired,
    isWaitingForQR,
    currentAttempt,
    maxAttempts
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <QrCode className="h-5 w-5 text-green-600" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription className="text-gray-700">
            {isWaitingForQR 
              ? `Preparando QR Code para a instância "${instanceName}"...`
              : `Escaneie o QR Code para conectar sua conta WhatsApp à instância "${instanceName}"`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <QRCodeDisplay
            qrCodeUrl={qrCodeUrl}
            isWaitingForQR={isWaitingForQR}
            currentAttempt={currentAttempt}
            maxAttempts={maxAttempts}
            isExpired={isExpired}
            onExpired={handleExpired}
            isOpen={isOpen}
          />
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="w-full bg-white/50 hover:bg-white/70 border-white/40 rounded-xl transition-all duration-200 text-gray-800"
          >
            {isExpired ? 'Fechar e Tentar Novamente' : 'Fechar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
