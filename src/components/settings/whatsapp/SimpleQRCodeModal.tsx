
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Smartphone, Wifi } from "lucide-react";

interface SimpleQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string | null;
}

export function SimpleQRCodeModal({ isOpen, onClose, qrCodeUrl }: SimpleQRCodeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 justify-center">
            <Wifi className="h-6 w-6 text-green-600" />
            <DialogTitle className="text-xl">Conectar WhatsApp</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {qrCodeUrl ? (
            <>
              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-green-100">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
              
              <div className="text-center space-y-3 max-w-sm">
                <div className="flex items-center gap-2 justify-center text-green-600">
                  <Smartphone className="h-5 w-5" />
                  <span className="font-medium">Como conectar:</span>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-2 text-left">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                    <span>Abra o WhatsApp no seu celular</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                    <span>Vá em <strong>Menu → Aparelhos conectados</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                    <span>Toque em <strong>"Conectar um aparelho"</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                    <span>Escaneie este QR code</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Gerando QR Code...</p>
            </div>
          )}
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
