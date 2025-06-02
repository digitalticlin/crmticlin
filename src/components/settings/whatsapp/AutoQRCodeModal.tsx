
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useQRCodeValidation } from "@/hooks/whatsapp/useQRCodeValidation";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const validation = validateQRCode(qrCode);

  const renderQRCodeSection = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
            <div className="absolute inset-0 bg-green-100 rounded-full opacity-20 animate-pulse"></div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-green-600">Gerando QR Code...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Iniciando WhatsApp Web.js no servidor
            </p>
          </div>
        </div>
      );
    }

    if (!qrCode) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <AlertCircle className="h-12 w-12 text-orange-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-orange-600">QR Code não disponível</p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Gerar QR Code" para tentar novamente
            </p>
          </div>
        </div>
      );
    }

    if (!validation.isValid) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <p className="text-sm font-medium text-red-600">QR Code inválido</p>
            <p className="text-xs text-muted-foreground mt-1">
              {validation.errorMessage}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-4 space-y-4">
        <div className="relative">
          <div className="bg-white p-4 rounded-xl border-2 border-green-200 shadow-lg">
            <img 
              src={qrCode} 
              alt="QR Code WhatsApp" 
              className="w-64 h-64 object-contain"
              onError={() => {
                console.error('Erro ao carregar QR Code:', qrCode?.substring(0, 50));
              }}
            />
          </div>
          <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <div className="text-center space-y-3 max-w-sm">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-600">QR Code pronto!</p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs font-medium text-green-800 mb-2">Como conectar:</p>
            <div className="text-xs text-green-700 space-y-1 text-left">
              <p>1. 📱 Abra o WhatsApp no seu celular</p>
              <p>2. ⚙️ Vá em Menu → Aparelhos conectados</p>
              <p>3. ➕ Toque em "Conectar um aparelho"</p>
              <p>4. 📸 Escaneie este QR code</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1 bg-green-100 rounded">
              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">W</span>
              </div>
            </div>
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        {renderQRCodeSection()}

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="flex-1 gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Gerar Novo QR
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Fechar
          </Button>
        </div>

        {validation.isValid && (
          <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-blue-700 text-center">
              💡 O QR Code expira em poucos minutos. Se não funcionar, gere um novo.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
