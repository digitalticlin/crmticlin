import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StagesList } from "./config/StagesList";
import { CreateStageForm } from "./config/CreateStageForm";
import { useFunnelStages } from "@/hooks/salesFunnel/stages/useFunnelStages";
import { useStageManagement } from "@/hooks/salesFunnel/useStageManagement";
import { useCallback } from "react";

interface FunnelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFunnelId?: string;
}

export const FunnelConfigModal = ({ isOpen, onClose, selectedFunnelId }: FunnelConfigModalProps) => {
  const { stages, refetch: refetchStages } = useFunnelStages({
    funnelId: selectedFunnelId || null,
    enabled: !!selectedFunnelId
  });

  const { addColumn, updateColumn, deleteColumn } = useStageManagement();

  // Converter stages para formato de columns para compatibilidade
  const columns = stages?.map(stage => ({
    id: stage.id,
    title: stage.title,
    color: stage.color || "#e0e0e0",
    isFixed: stage.is_fixed || false,
    leads: []
  })) || [];

  // Wrapper functions to ensure proper async handling
  const handleUpdateStage = useCallback(async (stage: any) => {
    await updateColumn(stage.id, {
      title: stage.title,
      color: stage.color
    });
    await refetchStages();
  }, [updateColumn, refetchStages]);

  const handleDeleteStage = useCallback(async (stageId: string) => {
    await deleteColumn(stageId);
    await refetchStages();
  }, [deleteColumn, refetchStages]);

  const handleCreateStage = useCallback(async (title: string, color?: string) => {
    if (!selectedFunnelId) return;
    await addColumn(title, color || "#3b82f6", selectedFunnelId);
    await refetchStages();
  }, [addColumn, selectedFunnelId, refetchStages]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-800 text-center">
            Configurar Funil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <StagesList
            stages={columns}
            onUpdateStage={handleUpdateStage}
            onDeleteStage={handleDeleteStage}
            onRefreshStages={refetchStages}
          />

          <CreateStageForm onCreateStage={handleCreateStage} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
