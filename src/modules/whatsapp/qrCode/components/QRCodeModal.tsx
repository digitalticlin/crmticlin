
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeDisplay } from './QRCodeDisplay';
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onGenerate?: () => void;
}

export const QRCodeModal = ({
  isOpen,
  onClose,
  qrCode,
  instanceName,
  isLoading,
  error,
  onRefresh,
  onGenerate
}: QRCodeModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            QR Code - {instanceName}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <QRCodeDisplay 
            qrCode={qrCode}
            isLoading={isLoading}
            error={error}
          />

          <div className="flex gap-2 justify-center">
            {!qrCode && !isLoading && onGenerate && (
              <Button onClick={onGenerate} variant="whatsapp">
                Gerar QR Code
              </Button>
            )}
            
            {qrCode && (
              <Button onClick={onRefresh} variant="outline" disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            )}
          </div>

          {qrCode && (
            <div className="text-center text-sm text-gray-600 space-y-1">
              <p>1. Abra o WhatsApp no seu celular</p>
              <p>2. Vá em Menu → Dispositivos conectados</p>
              <p>3. Toque em "Conectar um dispositivo"</p>
              <p>4. Escaneie este QR Code</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
