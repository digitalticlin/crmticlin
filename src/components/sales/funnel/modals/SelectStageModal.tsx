
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
        <DialogHeader>
          <DialogTitle>Selecionar Etapa do Funil</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para qual etapa deseja mover o lead "{lead?.name}"?
          </p>
          
          <div className="space-y-2">
            {funnelStages.map((stage) => (
              <Button
                key={stage.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleStageSelect(stage.id)}
              >
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: stage.color || "#e0e0e0" }}
                />
                {stage.title}
              </Button>
            ))}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
