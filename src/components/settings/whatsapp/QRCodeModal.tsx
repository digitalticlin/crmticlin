
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, X } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string;
}

export const QRCodeModal = ({ isOpen, onClose, qrCode, instanceName }: QRCodeModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code - {instanceName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {qrCode ? (
            <div className="flex justify-center">
              <img 
                src={qrCode} 
                alt="QR Code" 
                className="max-w-full h-auto border rounded-lg"
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>QR Code não disponível</p>
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Como conectar:</strong><br />
              1. Abra o WhatsApp no seu celular<br />
              2. Vá em Configurações → Aparelhos conectados<br />
              3. Toque em "Conectar um aparelho"<br />
              4. Escaneie este QR Code
            </p>
          </div>
          
          <Button onClick={onClose} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
