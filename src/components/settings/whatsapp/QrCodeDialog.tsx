
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QrCodeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeUrl: string | null;
}

const QrCodeDialog = ({ isOpen, onOpenChange, qrCodeUrl }: QrCodeDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conecte seu WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie este código QR com seu WhatsApp para conectar sua conta.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          {qrCodeUrl ? (
            <>
              <img 
                src={qrCodeUrl} 
                alt="QR Code para conexão do WhatsApp" 
                className="w-full max-w-[250px] h-auto mb-4"
              />
              <p className="text-sm text-center text-muted-foreground">
                Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p>QR Code não disponível. Tente novamente.</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeDialog;
