
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSalesFunnelContext } from "../SalesFunnelProvider";
import { StagesList } from "./config/StagesList";
import { CreateStageForm } from "./config/CreateStageForm";

interface FunnelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FunnelConfigModal = ({ isOpen, onClose }: FunnelConfigModalProps) => {
  const { columns, updateColumn, deleteColumn, addColumn } = useSalesFunnelContext();

  // Wrapper functions to ensure proper async handling
  const handleUpdateStage = async (stage: any) => {
    await updateColumn(stage);
  };

  const handleDeleteStage = async (stageId: string) => {
    await deleteColumn(stageId);
  };

  const handleCreateStage = async (title: string) => {
    await addColumn(title);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white/10 backdrop-blur-xl border border-white/20 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Configurar Funil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <StagesList
            stages={columns}
            onUpdateStage={handleUpdateStage}
            onDeleteStage={handleDeleteStage}
          />

          <CreateStageForm onCreateStage={handleCreateStage} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
