
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, QrCode } from "lucide-react";
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-sm font-medium">Gerando QR Code...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aguarde enquanto o WhatsApp Web.js é inicializado
              </p>
            </div>
          ) : qrCode && qrValidation.isValid ? (
            <>
              <div className="bg-white p-4 rounded-lg mb-4 border">
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Como conectar:</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>1. Abra o WhatsApp no seu celular</p>
                  <p>2. Vá em Menu → Aparelhos conectados</p>
                  <p>3. Toque em "Conectar um aparelho"</p>
                  <p>4. Escaneie este QR code</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={onRefresh}
                className="mt-4"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar QR Code
              </Button>
            </>
          ) : qrValidation.isPlaceholder ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-sm font-medium">WhatsApp Web.js inicializando...</p>
              <p className="text-xs text-muted-foreground mt-1">
                {qrValidation.errorMessage}
              </p>
              <Button 
                variant="outline" 
                onClick={onRefresh}
                className="mt-4"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-8 w-8 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium">Erro ao gerar QR Code</p>
              <p className="text-xs text-muted-foreground mt-1">
                {qrValidation.errorMessage || 'Tente novamente'}
              </p>
              <Button 
                onClick={onRefresh}
                className="mt-4"
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
          className="w-full"
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
