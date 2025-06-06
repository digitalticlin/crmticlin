
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
      <DialogContent className="max-w-md bg-white/90 backdrop-blur-xl border border-white/30 rounded-3xl shadow-glass">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold text-gray-800 text-center">
            {dealType === "won" ? "Negociação Ganha" : "Negociação Perdida"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-gray-600 text-center">
            Adicione uma observação sobre esta negociação com "{leadName}":
          </p>
          
          <div className="space-y-3">
            <Label htmlFor="note" className="text-gray-700 font-medium">
              Observação (opcional)
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Motivo da vitória/perda, detalhes da negociação..."
              className="min-h-[100px] bg-white/70 border-white/40 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="px-6 py-2 bg-white/50 hover:bg-white/70 border-white/40 rounded-xl transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm}
              className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                dealType === "won" 
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-lg" 
                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg"
              }`}
            >
              Confirmar {dealType === "won" ? "Ganho" : "Perda"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
