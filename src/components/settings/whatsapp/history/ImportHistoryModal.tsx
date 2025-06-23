
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, MessageCircle, Users } from 'lucide-react';

interface ImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  instanceName: string;
  hasBeenImported: boolean;
  isImporting: boolean;
}

export const ImportHistoryModal = ({
  isOpen,
  onClose,
  onConfirm,
  instanceName,
  hasBeenImported,
  isImporting
}: ImportHistoryModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            {hasBeenImported ? 'Reimportar Histórico' : 'Importar Histórico do WhatsApp'}
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <div className="text-sm text-gray-600">
              Você está prestes a importar o histórico completo de conversas da instância:
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-900">📱 {instanceName}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">O que será importado:</div>
              <div className="space-y-1 text-sm text-gray-600 ml-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  Todos os contatos salvos
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Histórico completo de mensagens
                </div>
              </div>
            </div>

            {hasBeenImported && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <div className="font-medium">Atenção:</div>
                  <div>Esta instância já teve seu histórico importado anteriormente. 
                  Reimportar pode criar registros duplicados.</div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
              💡 <strong>Dica:</strong> Este processo pode levar alguns minutos dependendo da quantidade 
              de mensagens. Você pode fechar este modal e continuar usando o sistema normalmente.
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isImporting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isImporting}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {hasBeenImported ? 'Confirmar Reimportação' : 'Iniciar Importação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
