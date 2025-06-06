
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KanbanStage } from "@/types/funnel";
import { KanbanLead } from "@/types/kanban";

interface SelectStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: KanbanLead | null;
  stages: KanbanStage[];
  onSelectStage: (lead: KanbanLead, stageId: string) => void;
}

export const SelectStageModal = ({
  isOpen,
  onClose,
  lead,
  stages,
  onSelectStage
}: SelectStageModalProps) => {
  // Filter out GANHO and PERDIDO stages - only show funnel stages
  const funnelStages = stages.filter(stage => 
    !stage.is_won && !stage.is_lost
  );

  const handleStageSelect = (stageId: string) => {
    if (lead) {
      onSelectStage(lead, stageId);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold text-gray-800 text-center">
            Selecionar Etapa do Funil
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-gray-700 text-center font-medium">
            Para qual etapa deseja mover o lead "{lead?.name}"?
          </p>
          
          <div className="space-y-3">
            {funnelStages.map((stage) => (
              <Button
                key={stage.id}
                variant="outline"
                className="w-full justify-start bg-white/50 hover:bg-white/70 border-white/40 rounded-xl transition-all duration-200 p-4"
                onClick={() => handleStageSelect(stage.id)}
              >
                <div
                  className="w-4 h-4 rounded-full mr-3 shadow-sm"
                  style={{ backgroundColor: stage.color || "#e0e0e0" }}
                />
                <span className="font-medium text-gray-800">{stage.title}</span>
              </Button>
            ))}
          </div>
          
          <div className="flex justify-center pt-4">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="px-6 py-2 hover:bg-white/30 rounded-xl transition-all duration-200 text-gray-700 font-medium"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
