import { useState, useEffect } from "react";
import { KanbanLead } from "@/types/kanban";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Move, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { 
  MassActionsService, 
  FunnelOption, 
  StageOption 
} from "@/services/massActions/massActionsService";
import { BatchingService, BatchProgress } from "@/services/massActions/batchingService";
import { Progress } from "@/components/ui/progress";

interface MassMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: KanbanLead[];
  onSuccess: () => void;
}

export const MassMoveModal = ({
  isOpen,
  onClose,
  selectedLeads,
  onSuccess
}: MassMoveModalProps) => {
  console.log('[MassMoveModal] 📦 Props recebidas:', {
    isOpen,
    selectedLeads: selectedLeads?.length || 0,
    leadsData: selectedLeads?.map(l => ({ id: l.id, name: l.name })) || []
  });
  const [isMoving, setIsMoving] = useState(false);
  const [funnels, setFunnels] = useState<FunnelOption[]>([]);
  const [stages, setStages] = useState<StageOption[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingFunnels, setLoadingFunnels] = useState(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const selectedCount = selectedLeads.length;

  // Carregar funis disponíveis
  useEffect(() => {
    const loadFunnels = async () => {
      if (!isOpen) return;

      setLoadingFunnels(true);
      try {
        const funnelOptions = await MassActionsService.getFunnels();
        setFunnels(funnelOptions);
      } catch (error) {
        console.error('Erro ao carregar funis:', error);
        toast.error('Erro ao carregar funis disponíveis');
      } finally {
        setLoadingFunnels(false);
      }
    };

    loadFunnels();
  }, [isOpen]);

  // Carregar etapas quando funil for selecionado
  useEffect(() => {
    const loadStages = async () => {
      if (!selectedFunnel) {
        setStages([]);
        setSelectedStage(""); // Limpar etapa selecionada
        return;
      }

      setLoadingStages(true);
      setSelectedStage(""); // Limpar etapa selecionada ao mudar funil
      
      try {
        const stageOptions = await MassActionsService.getStagesByFunnel(selectedFunnel);
        setStages(stageOptions);
      } catch (error) {
        console.error('Erro ao carregar etapas:', error);
        toast.error('Erro ao carregar etapas do funil');
        setStages([]);
      } finally {
        setLoadingStages(false);
      }
    };

    loadStages();
  }, [selectedFunnel]);

  const handleMove = async () => {
    console.log('[MassMoveModal] 🚀 Iniciando movimentação:', {
      selectedStage,
      selectedFunnel,
      selectedCount,
      leadIds: selectedLeads.map(l => l.id)
    });
    
    if (!selectedStage || !selectedFunnel || selectedCount === 0) {
      console.log('[MassMoveModal] ⚠️ Validação falhou:', {
        selectedStage: !!selectedStage,
        selectedFunnel: !!selectedFunnel,
        selectedCount
      });
      return;
    }

    setIsMoving(true);
    
    // Mostrar barra de progresso para grandes volumes
    if (selectedCount > 100) {
      setShowProgress(true);
      setBatchProgress({ current: 0, total: 0, percentage: 0, processedItems: 0, totalItems: selectedCount });
    }
    
    try {
      const leadIds = selectedLeads.map(lead => lead.id);
      
      // Usar BatchingService para grandes volumes
      const result = await BatchingService.moveLeadsInBatches(
        leadIds, 
        selectedStage, 
        selectedFunnel,
        // Callback de progresso
        selectedCount > 100 ? (progress: BatchProgress) => {
          console.log('[MassMoveModal] 📈 Progresso:', progress);
          setBatchProgress(progress);
        } : undefined
      );

      if (result.success) {
        const selectedStageName = stages.find(s => s.id === selectedStage)?.title;
        const selectedFunnelName = funnels.find(f => f.id === selectedFunnel)?.name;
        
        if (result.totalProcessed === selectedCount) {
          // Sucesso total
          toast.success(
            `${result.totalProcessed} lead${result.totalProcessed > 1 ? 's' : ''} movido${result.totalProcessed > 1 ? 's' : ''} para "${selectedStageName}" em "${selectedFunnelName}"!`
          );
        } else {
          // Sucesso parcial
          toast.success(result.message, {
            description: `${result.totalProcessed} de ${selectedCount} leads foram movidos com sucesso.`
          });
        }
        
        onSuccess();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao mover leads:', error);
      toast.error('Erro inesperado ao mover leads');
    } finally {
      setIsMoving(false);
      setShowProgress(false);
      setBatchProgress(null);
    }
  };

  const handleClose = () => {
    setSelectedFunnel("");
    setSelectedStage("");
    setShowProgress(false);
    setBatchProgress(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Move size={20} />
            Mover Leads Selecionados
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-gray-700">
            Movendo{' '}
            <strong className="text-blue-600">{selectedCount}</strong>{' '}
            lead{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="funnel-select" className="text-sm font-medium">
                Selecionar Funil
              </Label>
              <Select
                value={selectedFunnel}
                onValueChange={setSelectedFunnel}
                disabled={loadingFunnels}
              >
                <SelectTrigger id="funnel-select" className="mt-1">
                  <SelectValue 
                    placeholder={loadingFunnels ? "Carregando funis..." : "Escolha um funil"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {funnels.map((funnel) => (
                    <SelectItem key={funnel.id} value={funnel.id}>
                      {funnel.name}
                    </SelectItem>
                  ))}
                  {funnels.length === 0 && !loadingFunnels && (
                    <SelectItem value="no-funnels" disabled>
                      Nenhum funil encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="stage-select" className="text-sm font-medium">
                Selecionar Etapa
              </Label>
              <Select
                value={selectedStage}
                onValueChange={setSelectedStage}
                disabled={!selectedFunnel || loadingStages}
              >
                <SelectTrigger id="stage-select" className="mt-1">
                  <SelectValue 
                    placeholder={
                      !selectedFunnel 
                        ? "Primeiro selecione um funil" 
                        : loadingStages 
                          ? "Carregando etapas..." 
                          : stages.length === 0
                            ? "Nenhuma etapa disponível"
                            : "Escolha uma etapa"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingStages ? (
                    <SelectItem value="loading-stages" disabled>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        Carregando etapas...
                      </div>
                    </SelectItem>
                  ) : stages.length === 0 ? (
                    <SelectItem value="no-stages" disabled>
                      {selectedFunnel ? "Nenhuma etapa disponível neste funil" : "Selecione um funil primeiro"}
                    </SelectItem>
                  ) : (
                    stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedFunnel && stages.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {stages.length} etapa{stages.length !== 1 ? 's' : ''} disponível{stages.length !== 1 ? 'is' : ''}
                </p>
              )}
            </div>
          </div>

          {selectedStage && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm">
              <ArrowRight size={16} className="text-blue-500" />
              <span className="text-blue-700">
                Leads serão movidos para "{stages.find(s => s.id === selectedStage)?.title}"
              </span>
            </div>
          )}

          {/* Barra de Progresso para Grandes Volumes */}
          {showProgress && batchProgress && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between text-sm text-blue-700">
                <span className="font-medium">Processando em lotes...</span>
                <span>{batchProgress.percentage}%</span>
              </div>
              
              <Progress value={batchProgress.percentage} className="w-full h-2" />
              
              <div className="flex justify-between text-xs text-blue-600">
                <span>Lote {batchProgress.current} de {batchProgress.total}</span>
                <span>{batchProgress.processedItems} / {batchProgress.totalItems} leads</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isMoving}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleMove}
            disabled={isMoving || !selectedStage}
            className="flex items-center gap-2"
          >
            {isMoving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {showProgress ? 'Processando...' : 'Movendo...'}
              </>
            ) : (
              <>
                <Move size={16} />
                {selectedCount > 100 ? `Mover ${selectedCount} Leads` : 'Confirmar Movimentação'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};