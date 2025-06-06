
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DealNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string, value: number) => void;
  dealType: "won" | "lost";
  leadName: string;
  currentValue?: number;
}

export const DealNoteModal = ({
  isOpen,
  onClose,
  onConfirm,
  dealType,
  leadName,
  currentValue
}: DealNoteModalProps) => {
  const [note, setNote] = useState("");
  const [value, setValue] = useState(currentValue || 0);

  const handleConfirm = () => {
    onConfirm(note, value);
    setNote("");
    setValue(0);
  };

  const handleClose = () => {
    setNote("");
    setValue(currentValue || 0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white/35 backdrop-blur-lg border border-white/30">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold text-gray-800 text-center">
            {dealType === "won" ? "Negociação Ganha" : "Negociação Perdida"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-gray-700 text-center font-medium">
            {dealType === "won" 
              ? `Confirme os dados da negociação com "${leadName}":` 
              : `Adicione uma observação sobre esta negociação com "${leadName}":`
            }
          </p>
          
          {dealType === "won" && (
            <div className="space-y-3">
              <Label htmlFor="value" className="text-gray-800 font-medium">
                Valor da Negociação (R$)
              </Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                placeholder="0,00"
                min="0"
                step="0.01"
                className="bg-white/70 border-white/40 focus:border-green-400 focus:ring-green-400/20 rounded-xl text-gray-800"
              />
            </div>
          )}
          
          <div className="space-y-3">
            <Label htmlFor="note" className="text-gray-800 font-medium">
              Observação (opcional)
            </Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                dealType === "won" 
                  ? "Detalhes da venda, forma de pagamento, prazo de entrega..."
                  : "Motivo da perda, feedback do cliente, próximos passos..."
              }
              className="min-h-[100px] bg-white/70 border-white/40 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl resize-none text-gray-800"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="px-6 py-2 bg-white/50 hover:bg-white/70 border-white/40 rounded-xl transition-all duration-200 text-gray-800"
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
