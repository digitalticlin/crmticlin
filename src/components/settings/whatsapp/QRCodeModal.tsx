
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string;
}

export const QRCodeModal = ({ isOpen, onClose, qrCode, instanceName }: QRCodeModalProps) => {
  const [isScanned, setIsScanned] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsScanned(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/30 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
            <span>Conectar {instanceName}</span>
            <Button variant="ghost" size="icon" onClick={onClose} 
              className="hover:bg-white/20 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          {qrCode ? (
            <div className="text-center space-y-4">
              <div className="bg-white p-6 rounded-2xl border-2 border-green-200/70 inline-block
                shadow-lg backdrop-blur-sm">
                <img 
                  src={qrCode} 
                  alt="QR Code para conexão do WhatsApp" 
                  className="w-64 h-64 object-contain rounded-lg"
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 text-lg">
                  Escaneie com seu WhatsApp
                </h3>
                <div className="text-sm text-gray-600 space-y-2 bg-white/20 backdrop-blur-sm 
                  rounded-xl p-4 border border-white/30">
                  <p><span className="font-medium">1.</span> Abra o WhatsApp no seu celular</p>
                  <p><span className="font-medium">2.</span> Vá em <strong>Menu</strong> → <strong>WhatsApp Web</strong></p>
                  <p><span className="font-medium">3.</span> Aponte a câmera para este QR Code</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-green-600" />
              <h3 className="font-semibold mb-2 text-gray-800">Preparando QR Code...</h3>
              <p className="text-sm text-gray-600">
                Aguarde enquanto geramos seu código de conexão
              </p>
            </div>
          )}

          {/* Success State */}
          {isScanned && (
            <div className="text-center py-4 bg-green-50/80 backdrop-blur-sm rounded-xl border border-green-200/50">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <h3 className="font-semibold text-green-700 mb-2">Conectado com sucesso!</h3>
              <p className="text-sm text-green-600">
                Seu WhatsApp está sendo sincronizado. Isso pode levar alguns minutos.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30"
            >
              Fechar
            </Button>
            {qrCode && !isScanned && (
              <Button 
                onClick={() => setIsScanned(true)}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                  text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Já escaneei
              </Button>
            )}
          </div>

          {/* Tips */}
          {qrCode && !isScanned && (
            <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/50">
              <h4 className="font-medium text-blue-900 mb-2">💡 Dicas:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Mantenha a câmera estável ao escanear</li>
                <li>• Certifique-se de ter boa iluminação</li>
                <li>• O QR Code expira em alguns minutos</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
