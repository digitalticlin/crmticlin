
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
      <DialogContent className="max-w-md bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-glass">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold text-gray-800 text-center">
            Conecte seu WhatsApp
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-center">
            Escaneie este código QR com seu WhatsApp para conectar sua conta.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {qrCodeUrl ? (
            <>
              <div className="bg-white/70 p-4 rounded-2xl border border-white/40 shadow-lg">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code para conexão do WhatsApp" 
                  className="w-full max-w-[250px] h-auto rounded-xl"
                />
              </div>
              <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50 w-full">
                <p className="text-sm text-center text-blue-700 font-medium">
                  Abra o WhatsApp no seu celular, vá em <strong>Configurações</strong> &gt; <strong>Aparelhos conectados</strong> &gt; <strong>Conectar um aparelho</strong>
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <p className="text-center">QR Code não disponível. Tente novamente.</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full bg-white/50 hover:bg-white/70 border-white/40 rounded-xl transition-all duration-200"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeDialog;
