
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCcw, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/spinner";

interface AutoQRCodeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  qrCode: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function AutoQRCodeModal({ 
  isOpen, 
  onOpenChange, 
  qrCode, 
  isLoading = false,
  onRefresh 
}: AutoQRCodeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Escaneie o QR code com seu WhatsApp para conectar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">
                Gerando QR code...
              </p>
            </div>
          ) : qrCode ? (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-green-400 shadow-lg mb-4">
                <img 
                  src={qrCode} 
                  alt="QR Code para conexão do WhatsApp" 
                  className="w-64 h-64 object-contain"
                />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  1. Abra o WhatsApp no seu celular
                </p>
                <p className="text-sm text-muted-foreground">
                  2. Vá em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  3. Toque em <strong>Conectar um aparelho</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  4. Escaneie este QR code
                </p>
              </div>

              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="mt-4"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Atualizar QR Code
                </Button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">
                QR code não disponível. Tente novamente.
              </p>
              {onRefresh && (
                <Button variant="outline" onClick={onRefresh}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              )}
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
}
