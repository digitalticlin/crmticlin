
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

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
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          {isLoading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </>
          ) : qrCode ? (
            <>
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <img 
                  src={qrCode} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-green-600">QR Code pronto!</p>
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
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Gerar Novo QR Code
              </Button>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  QR Code não disponível
                </p>
                <Button 
                  onClick={onRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Gerar QR Code
                </Button>
              </div>
            </>
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
