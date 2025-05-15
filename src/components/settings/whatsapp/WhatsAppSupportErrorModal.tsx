
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface WhatsAppSupportErrorModalProps {
  open: boolean;
  title?: string;
  description?: string;
  errorDetail?: string;
  onClose: () => void;
  onRetry?: () => void;
}

const SUPPORT_WA_NUMBER = "5511912345678"; // Atualize aqui o número do seu suporte

export function WhatsAppSupportErrorModal({
  open,
  title = "Ocorreu um erro ao conectar o WhatsApp",
  description = "Infelizmente não foi possível completar a operação.",
  errorDetail,
  onClose,
  onRetry,
}: WhatsAppSupportErrorModalProps) {
  const whatsappUrl = `https://wa.me/${SUPPORT_WA_NUMBER}?text=${encodeURIComponent(
    `Olá! Preciso de ajuda com o sistema WhatsApp. Detalhe do erro: ${errorDetail ?? ""}`
  )}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        {errorDetail && (
          <div className="bg-muted text-xs p-2 rounded mb-2 text-center break-all">
            {errorDetail}
          </div>
        )}
        <DialogFooter className="flex flex-col gap-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCcw className="w-4 h-4 mr-2" /> Tentar novamente
            </Button>
          )}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" className="w-full">
              Falar com Suporte no WhatsApp
            </Button>
          </a>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
