
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DealNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  dealType: "won" | "lost";
  leadName: string;
}

export const DealNoteModal = ({
  isOpen,
  onClose,
  onConfirm,
  dealType,
  leadName
}: DealNoteModalProps) => {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note);
    setNote("");
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {dealType === "won" ? "Negociação Ganha" : "Negociação Perdida"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adicione uma observação sobre esta negociação com "{leadName}":
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="note">Observação (opcional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Motivo da vitória/perda, detalhes da negociação..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              variant={dealType === "won" ? "default" : "destructive"}
            >
              Confirmar {dealType === "won" ? "Ganho" : "Perda"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
