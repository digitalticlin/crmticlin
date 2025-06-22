
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, QrCode, CheckCircle, AlertCircle } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string;
  instanceId: string;
}

export const QRCodeModal = ({
  isOpen,
  onClose,
  qrCode,
  instanceName,
  instanceId
}: QRCodeModalProps) => {
  const renderContent = () => {
    // Estado: QR Code disponível
    if (qrCode && qrCode !== 'waiting') {
      return (
        <div className="text-center space-y-6">
          <div className="bg-white p-4 rounded-2xl border-2 border-green-200 shadow-lg">
            <img 
              src={qrCode} 
              alt="QR Code para conexão do WhatsApp" 
              className="w-64 h-64 rounded-xl mx-auto"
            />
          </div>
          
          <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
            <div className="flex items-center gap-2 justify-center text-green-700 mb-3">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">QR Code Pronto!</span>
            </div>
            
            <div className="text-sm text-green-700 space-y-2">
              <p className="font-medium mb-2">Como conectar:</p>
              <ol className="text-left space-y-1">
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Vá em Menu → Aparelhos conectados</li>
                <li>3. Toque em "Conectar um aparelho"</li>
                <li>4. Escaneie este QR code</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }

    // Estado: Aguardando QR Code
    if (qrCode === 'waiting') {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="font-medium text-blue-900 mb-2">Gerando QR Code...</h3>
            <p className="text-sm text-blue-700">
              Aguarde enquanto preparamos sua conexão WhatsApp
            </p>
          </div>
        </div>
      );
    }

    // Estado: Sem QR Code
    return (
      <div className="text-center py-8">
        <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">QR Code não disponível</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5 text-green-600" />
            QR Code - {instanceName}
          </DialogTitle>
        </DialogHeader>

        {renderContent()}

        <div className="flex gap-3 mt-4">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
