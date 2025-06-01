
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface WhatsAppQRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string | null;
}

export function WhatsAppQRCodeModal({
  open,
  onOpenChange,
  qrCode
}: WhatsAppQRCodeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          {qrCode ? (
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
            </>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Gerando QR Code...</p>
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
