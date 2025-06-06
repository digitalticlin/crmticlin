
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, X, Smartphone } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string;
}

export const QRCodeModal = ({ isOpen, onClose, qrCode, instanceName }: QRCodeModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-glass">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold text-gray-800">
            <QrCode className="h-6 w-6 text-green-600" />
            QR Code - {instanceName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {qrCode ? (
            <>
              <div className="flex justify-center">
                <div className="bg-white/70 p-4 rounded-2xl border border-white/40 shadow-lg">
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="max-w-full h-auto rounded-xl"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-2">Como conectar:</p>
                    <ol className="text-blue-700 space-y-1">
                      <li>1. Abra o WhatsApp no seu celular</li>
                      <li>2. Vá em Configurações → Aparelhos conectados</li>
                      <li>3. Toque em "Conectar um aparelho"</li>
                      <li>4. Escaneie este QR Code</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>QR Code não disponível</p>
            </div>
          )}
          
          <Button 
            onClick={onClose} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200"
          >
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
