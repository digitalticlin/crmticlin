
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (deal: { status: "won" | "lost"; value: number; note?: string }) => Promise<void>;
  isLoading: boolean;
}

export function AddDealModal({ open, onClose, onSubmit, isLoading }: AddDealModalProps) {
  const [newDeal, setNewDeal] = useState({
    status: "won" as "won" | "lost",
    value: "",
    note: ""
  });

  const handleAddDeal = async () => {
    if (!newDeal.value) return;

    try {
      await onSubmit({
        status: newDeal.status,
        value: parseFloat(newDeal.value),
        note: newDeal.note || undefined
      });
      
      setNewDeal({ status: "won", value: "", note: "" });
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar deal:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Nova Negociação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status" className="text-gray-700">Status</Label>
            <Select 
              value={newDeal.status} 
              onValueChange={(value: "won" | "lost") => setNewDeal({...newDeal, status: value})}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="won">Ganho</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="value" className="text-gray-700">Valor</Label>
            <Input
              id="value"
              type="number"
              placeholder="0.00"
              value={newDeal.value}
              onChange={(e) => setNewDeal({...newDeal, value: e.target.value})}
              className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
            />
          </div>
          
          <div>
            <Label htmlFor="note" className="text-gray-700">Observações</Label>
            <Textarea
              id="note"
              placeholder="Detalhes da negociação..."
              value={newDeal.note}
              onChange={(e) => setNewDeal({...newDeal, note: e.target.value})}
              className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800] bg-white"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleAddDeal}
              disabled={!newDeal.value || isLoading}
              className="bg-[#d3d800] hover:bg-[#b8c200] text-black flex-1"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
