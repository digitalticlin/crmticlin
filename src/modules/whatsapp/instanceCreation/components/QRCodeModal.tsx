import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useQRCodeModal } from '../hooks/useQRCodeModal';

export const QRCodeModal = () => {
  const { isOpen, qrCode, isLoading, error, closeModal } = useQRCodeModal();

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Gerando QR Code...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-500">
              <p>{error}</p>
            </div>
          )}

          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                className="w-64 h-64"
              />
              <p className="text-sm text-muted-foreground text-center">
                Abra o WhatsApp no seu celular e escaneie o QR Code
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 