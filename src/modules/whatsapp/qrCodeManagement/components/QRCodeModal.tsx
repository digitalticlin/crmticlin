
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
  isLoading: boolean;
  error: string | null;
  instanceName: string;
  onRetry: () => void;
}

export const QRCodeModal = ({
  isOpen,
  onClose,
  qrCode,
  isLoading,
  error,
  instanceName,
  onRetry
}: QRCodeModalProps) => {
  const renderContent = () => {
    // Estado: Erro
    if (error) {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="font-medium text-red-900 mb-2">Erro ao gerar QR Code</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            
            <Button onClick={onRetry} className="bg-red-600 hover:bg-red-700 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      );
    }

    // Estado: Carregando
    if (isLoading && !qrCode) {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="font-medium text-blue-900 mb-2">Gerando QR Code...</h3>
            <p className="text-sm text-blue-700">
              Aguarde enquanto preparamos sua conexão WhatsApp
            </p>
            
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      );
    }

    // Estado: QR Code disponível
    if (qrCode) {
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

          <Button 
            variant="outline" 
            onClick={onRetry}
            className="bg-white/50 hover:bg-white/70 border-white/40 rounded-xl"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Gerar Novo QR Code
          </Button>
        </div>
      );
    }

    // Estado padrão
    return (
      <div className="text-center py-8">
        <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Preparando QR Code...</p>
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
