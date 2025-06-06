
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Conectar {instanceName}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          {qrCode ? (
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-green-200 inline-block">
                <img 
                  src={qrCode} 
                  alt="QR Code para conexão do WhatsApp" 
                  className="w-64 h-64 object-contain"
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">
                  Escaneie com seu WhatsApp
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>1. Abra o WhatsApp no seu celular</p>
                  <p>2. Vá em <strong>Menu</strong> → <strong>WhatsApp Web</strong></p>
                  <p>3. Aponte a câmera para este QR Code</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-green-600" />
              <h3 className="font-medium mb-2">Preparando QR Code...</h3>
              <p className="text-sm text-gray-600">
                Aguarde enquanto geramos seu código de conexão
              </p>
            </div>
          )}

          {/* Success State */}
          {isScanned && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <h3 className="font-medium text-green-700 mb-2">Conectado com sucesso!</h3>
              <p className="text-sm text-gray-600">
                Seu WhatsApp está sendo sincronizado. Isso pode levar alguns minutos.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            {qrCode && !isScanned && (
              <Button 
                onClick={() => setIsScanned(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Já escaneei
              </Button>
            )}
          </div>

          {/* Tips */}
          {qrCode && !isScanned && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
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
