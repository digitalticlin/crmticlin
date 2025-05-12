
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface AddColumnDialogProps {
  onAddColumn: (title: string) => void;
}

export const AddColumnDialog = ({ onAddColumn }: AddColumnDialogProps) => {
  const [newColumnTitle, setNewColumnTitle] = useState("");
  
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return;
    onAddColumn(newColumnTitle);
    setNewColumnTitle("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Etapa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nova Etapa</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Nome da etapa"
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          className="mt-4"
        />
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button 
              className="bg-ticlin hover:bg-ticlin/90 text-black"
              onClick={handleAddColumn}
            >
              Adicionar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
