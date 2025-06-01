
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface InstanceQRModalProps {
  showQR: boolean;
  onOpenChange: (open: boolean) => void;
  instance: WhatsAppWebInstance;
  isRefreshing: boolean;
  onRefreshQR: () => Promise<void>;
}

export function InstanceQRModal({
  showQR,
  onOpenChange,
  instance,
  isRefreshing,
  onRefreshQR
}: InstanceQRModalProps) {
  return (
    <Dialog open={showQR} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          {instance.qr_code ? (
            <>
              <div className="bg-white p-4 rounded-lg mb-4">
                <img 
                  src={instance.qr_code} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                1. Abra o WhatsApp no seu celular<br/>
                2. Vá em Menu → Aparelhos conectados<br/>
                3. Toque em "Conectar um aparelho"<br/>
                4. Escaneie este QR code
              </p>
            </>
          ) : (
            <div className="text-center py-8">
              <p>QR Code não disponível. Tente gerar um novo.</p>
              <Button 
                onClick={onRefreshQR} 
                disabled={isRefreshing}
                className="mt-4"
              >
                {isRefreshing ? 'Gerando...' : 'Gerar QR Code'}
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRefreshQR}
            disabled={isRefreshing}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
