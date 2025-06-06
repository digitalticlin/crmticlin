
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, QrCode, Smartphone } from "lucide-react";
import { useQRCodeValidation } from "@/hooks/whatsapp/useQRCodeValidation";

interface AutoQRCodeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function AutoQRCodeModal({ 
  isOpen, 
  onOpenChange, 
  qrCode, 
  isLoading,
  onRefresh 
}: AutoQRCodeModalProps) {
  const { validateQRCode } = useQRCodeValidation();
  const qrValidation = validateQRCode(qrCode);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-glass">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold text-gray-800">
            <QrCode className="h-6 w-6 text-green-600" />
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {isLoading ? (
            <div className="text-center space-y-4">
              <div className="bg-blue-50/80 backdrop-blur-sm p-6 rounded-2xl border border-blue-200/50">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Gerando QR Code...</p>
                <p className="text-xs text-blue-700 mt-1">
                  Aguarde enquanto o WhatsApp Web.js é inicializado
                </p>
              </div>
            </div>
          ) : qrCode && qrValidation.isValid ? (
            <>
              <div className="bg-white/70 p-4 rounded-2xl border border-white/40 shadow-lg">
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 rounded-xl"
                />
              </div>
              
              <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50 w-full">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-2">Como conectar:</p>
                    <ol className="text-blue-700 space-y-1">
                      <li>1. Abra o WhatsApp no seu celular</li>
                      <li>2. Vá em Menu → Aparelhos conectados</li>
                      <li>3. Toque em "Conectar um aparelho"</li>
                      <li>4. Escaneie este QR code</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={onRefresh}
                className="bg-white/50 hover:bg-white/70 border-white/40 rounded-xl transition-all duration-200"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar QR Code
              </Button>
            </>
          ) : qrValidation.isPlaceholder ? (
            <div className="text-center space-y-4">
              <div className="bg-orange-50/80 backdrop-blur-sm p-6 rounded-2xl border border-orange-200/50">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-orange-500" />
                <p className="text-sm font-medium text-orange-900">WhatsApp Web.js inicializando...</p>
                <p className="text-xs text-orange-700 mt-1">
                  {qrValidation.errorMessage}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={onRefresh}
                className="bg-white/50 hover:bg-white/70 border-white/40 rounded-xl transition-all duration-200"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-red-50/80 backdrop-blur-sm p-6 rounded-2xl border border-red-200/50">
                <QrCode className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-sm font-medium text-red-900">Erro ao gerar QR Code</p>
                <p className="text-xs text-red-700 mt-1">
                  {qrValidation.errorMessage || 'Tente novamente'}
                </p>
              </div>
              <Button 
                onClick={onRefresh}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar QR Code
              </Button>
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)}
          className="w-full bg-white/50 hover:bg-white/70 border-white/40 rounded-xl transition-all duration-200"
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
