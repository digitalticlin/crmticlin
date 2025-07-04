import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { HexColorPicker } from "react-colorful";

interface CreateTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTag: (name: string, color: string) => void;
}

export const CreateTagDialog = ({
  isOpen,
  onClose,
  onCreateTag,
}: CreateTagDialogProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6"); // Azul padrão

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateTag(name.trim(), color);
      setName("");
      setColor("#3b82f6");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Tag</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome da tag"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <HexColorPicker color={color} onChange={setColor} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Criar Tag
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 