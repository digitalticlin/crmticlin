import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSalesFunnelDirect } from "@/hooks/salesFunnel/useSalesFunnelDirect";
import { StagesList } from "./config/StagesList";
import { CreateStageForm } from "./config/CreateStageForm";

interface FunnelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FunnelConfigModal = ({ isOpen, onClose }: FunnelConfigModalProps) => {
  const { columns, updateColumn, deleteColumn, addColumn, refetchStages } = useSalesFunnelDirect();

  // Wrapper functions to ensure proper async handling
  const handleUpdateStage = async (stage: any) => {
    await updateColumn(stage);
  };

  const handleDeleteStage = async (stageId: string) => {
    await deleteColumn(stageId);
  };

  const handleCreateStage = async (title: string, color?: string) => {
    await addColumn(title, color || "#3b82f6");
  };

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
