import { useState } from "react";
import { KanbanLead } from "@/types/kanban";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { MassActionsService } from "@/services/massActions/massActionsService";
import { BatchingService, BatchProgress } from "@/services/massActions/batchingService";
import { Progress } from "@/components/ui/progress";

interface MassDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: KanbanLead[];
  onSuccess: () => void;
}

export const MassDeleteModal = ({
  isOpen,
  onClose,
  selectedLeads,
  onSuccess
}: MassDeleteModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const selectedCount = selectedLeads.length;

  const handleDelete = async () => {
    if (selectedCount === 0) return;

    setIsDeleting(true);
    
    // Mostrar barra de progresso para grandes volumes
    if (selectedCount > 100) {
      setShowProgress(true);
      setBatchProgress({ current: 0, total: 0, percentage: 0, processedItems: 0, totalItems: selectedCount });
    }
    
    try {
      const leadIds = selectedLeads.map(lead => lead.id);
      
      // Usar BatchingService para grandes volumes
      const result = await BatchingService.deleteLeadsInBatches(
        leadIds,
        // Callback de progresso
        selectedCount > 100 ? (progress: BatchProgress) => {
          console.log('[MassDeleteModal] 📈 Progresso:', progress);
          setBatchProgress(progress);
        } : undefined
      );

      if (result.success) {
        if (result.totalProcessed === selectedCount) {
          // Sucesso total
          toast.success(result.message);
        } else {
          // Sucesso parcial
          toast.success(result.message, {
            description: `${result.totalProcessed} de ${selectedCount} leads foram excluídos com sucesso.`
          });
        }
        onSuccess();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao excluir leads:', error);
      toast.error('Erro inesperado ao excluir leads');
    } finally {
      setIsDeleting(false);
      setShowProgress(false);
      setBatchProgress(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-700">
            <Trash2 size={20} />
            Excluir Leads Selecionados
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Esta ação não pode ser desfeita. Os leads serão removidos permanentemente do sistema.
            </AlertDescription>
          </Alert>

          <p className="text-gray-600">
            Você está prestes a excluir{' '}
            <strong className="text-gray-800">{selectedCount}</strong>{' '}
            lead{selectedCount > 1 ? 's' : ''}:
          </p>

          <div className="mt-3 max-h-32 overflow-y-auto">
            <ul className="space-y-1">
              {selectedLeads.slice(0, 5).map((lead) => (
                <li key={lead.id} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                  {lead.name} {lead.phone && `(${lead.phone})`}
                </li>
              ))}
              {selectedCount > 5 && (
                <li className="text-sm text-gray-500 font-medium">
                  ... e mais {selectedCount - 5} lead{selectedCount - 5 > 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </div>

          {/* Barra de Progresso para Grandes Volumes */}
          {showProgress && batchProgress && (
            <div className="mt-4 space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between text-sm text-red-700">
                <span className="font-medium">Excluindo em lotes...</span>
                <span>{batchProgress.percentage}%</span>
              </div>
              
              <Progress value={batchProgress.percentage} className="w-full h-2" />
              
              <div className="flex justify-between text-xs text-red-600">
                <span>Lote {batchProgress.current} de {batchProgress.total}</span>
                <span>{batchProgress.processedItems} / {batchProgress.totalItems} leads</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {showProgress ? 'Processando...' : 'Excluindo...'}
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {selectedCount > 100 ? `Excluir ${selectedCount} Leads` : 'Confirmar Exclusão'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};