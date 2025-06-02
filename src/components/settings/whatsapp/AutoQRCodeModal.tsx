
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Smartphone, Wifi } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/spinner";

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
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            {isLoading ? (
              <div className="flex flex-col items-center py-8">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Gerando QR Code...
                </p>
              </div>
            ) : qrCode ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                    <img
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="font-medium">Como conectar:</p>
                  <ol className="text-left list-decimal list-inside space-y-1">
                    <li>Abra o WhatsApp no seu celular</li>
                    <li>Toque em ⋮ ou Configurações</li>
                    <li>Toque em "Aparelhos conectados"</li>
                    <li>Toque em "Conectar um aparelho"</li>
                    <li>Aponte a câmera para este QR code</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <Wifi className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm text-muted-foreground">
                  QR Code não disponível
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar QR
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
