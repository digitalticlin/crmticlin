
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Wifi, X } from "lucide-react";

interface CreationLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  currentStep: string;
  retryCount: number;
  maxRetries: number;
}

export function CreationLoadingModal({ 
  isOpen, 
  onClose, 
  onCancel, 
  currentStep, 
  retryCount, 
  maxRetries 
}: CreationLoadingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 justify-center">
            <Wifi className="h-6 w-6 text-green-600" />
            <DialogTitle className="text-xl">Conectando WhatsApp</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <div className="text-center">
              <p className="font-medium text-green-900">Preparando conexão...</p>
              <p className="text-sm text-green-700 mt-1">{currentStep}</p>
            </div>
          </div>

          {retryCount > 0 && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Tentativa {retryCount} de {maxRetries}
              </p>
            </div>
          )}

          <div className="text-center space-y-2 max-w-sm">
            <p className="text-sm text-muted-foreground">
              Este processo pode levar alguns instantes...
            </p>
            <p className="text-xs text-muted-foreground">
              Estamos configurando seu WhatsApp Web no servidor
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
