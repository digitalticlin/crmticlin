
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  QrCode, 
  Smartphone, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Wifi
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AutoQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string | null;
  instanceName: string | null;
  isWaiting: boolean;
  currentAttempt: number;
  maxAttempts: number;
  error: string | null;
  onRetry: () => void;
}

export const AutoQRModal = ({
  isOpen,
  onClose,
  qrCode,
  instanceName,
  isWaiting,
  currentAttempt,
  maxAttempts,
  error,
  onRetry
}: AutoQRModalProps) => {
  
  const renderContent = () => {
    // ESTADO: Aguardando QR Code
    if (isWaiting && !qrCode && !error) {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="bg-blue-50/80 p-6 rounded-2xl border border-blue-200/50">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="font-medium text-blue-900 mb-2">Preparando Conexão</h3>
            <p className="text-sm text-blue-700">
              Aguarde enquanto o QR Code é gerado automaticamente...
            </p>
            {currentAttempt > 0 && (
              <p className="text-xs text-blue-600 mt-2">
                Tentativa {currentAttempt} de {maxAttempts}
              </p>
            )}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          
          <div className="bg-green-50/80 p-4 rounded-xl border border-green-200/50">
            <div className="flex items-center gap-2 justify-center text-green-700">
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-medium">Sistema Automático Ativo</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              O QR Code aparecerá automaticamente via webhook
            </p>
          </div>
        </div>
      );
    }

    // ESTADO: QR Code disponível
    if (qrCode && !error) {
      return (
        <div className="text-center space-y-6">
          <div className="bg-white/70 p-4 rounded-2xl border border-white/40 shadow-lg">
            <img 
              src={qrCode} 
              alt="QR Code WhatsApp" 
              className="w-64 h-64 rounded-xl mx-auto"
            />
          </div>
          
          <div className="bg-green-50/80 p-4 rounded-2xl border border-green-200/50">
            <div className="flex items-center gap-2 justify-center text-green-700 mb-3">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">QR Code Pronto!</span>
            </div>
            
            <div className="flex items-start gap-3 text-left">
              <Smartphone className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700">
                <p className="font-medium mb-2">Como conectar:</p>
                <ol className="space-y-1">
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Vá em Menu → Aparelhos conectados</li>
                  <li>3. Toque em "Conectar um aparelho"</li>
                  <li>4. Escaneie este QR code</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200/50">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Aguardando conexão...</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              O modal fechará automaticamente após a conexão
            </p>
          </div>

          <Button 
            variant="outline" 
            onClick={onRetry}
            className="bg-white/50 hover:bg-white/70 border-white/40 rounded-xl"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar QR Code
          </Button>
        </div>
      );
    }

    // ESTADO: Erro
    if (error) {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="bg-red-50/80 p-6 rounded-2xl border border-red-200/50">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="font-medium text-red-900 mb-2">Erro na Conexão</h3>
            <p className="text-sm text-red-700 mb-4">
              {error}
            </p>
            
            <Button 
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      );
    }

    // ESTADO: Padrão
    return (
      <div className="text-center py-8">
        <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Iniciando processo de conexão...</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-glass">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <span className="text-lg font-bold text-gray-800">Conectar WhatsApp</span>
                {instanceName && (
                  <p className="text-sm font-normal text-gray-600 mt-1">
                    {instanceName.length > 25 ? instanceName.substring(0, 22) + "..." : instanceName}
                  </p>
                )}
              </div>
            </div>
            
            <Badge variant="outline" className="border-green-300 text-green-700">
              <Wifi className="h-3 w-3 mr-1" />
              Auto
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {renderContent()}

        <div className="pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full bg-white/50 hover:bg-white/70 border-white/40 rounded-xl"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
