import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface PlaceholderQrModalProps {
  isOpen: boolean;
  qrCodeUrl: string | null;
  isCreating: boolean;
  onScanned: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  instanceName: string | null;
  onRefreshInstances?: () => void;
}

export default function PlaceholderQrModal({
  isOpen,
  qrCodeUrl,
  isCreating,
  onScanned,
  onRegenerate,
  onCancel,
  instanceName,
  onRefreshInstances
}: PlaceholderQrModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleScanClick = async () => {
    onScanned?.();
    // Atualiza página imediatamente após fechamento do modal
    if (onRefreshInstances) {
      setTimeout(() => onRefreshInstances(), 350); // ligeiro delay para evitar race com o fechamento
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Conecte seu WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o código QR abaixo para conectar sua conta do WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-64 h-64"
            />
          ) : (
            <div className="flex items-center justify-center">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando código QR...
                </>
              ) : (
                "Nenhum código QR disponível."
              )}
            </div>
          )}
          <div className="flex w-full justify-center space-x-2">
            <Button
              variant="outline"
              onClick={onRegenerate}
              disabled={isLoading}
            >
              Regenerar QR Code
            </Button>
            <Button
              onClick={handleScanClick}
              disabled={isLoading}
            >
              <Check className="mr-2 h-4 w-4" /> Já conectei
            </Button>
            <Button
              variant="destructive"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
