
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save } from "lucide-react";

interface CreateStageFormProps {
  onCreateStage: (title: string) => Promise<void>;
}

export const CreateStageForm = ({ onCreateStage }: CreateStageFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState("");
  const [newStageColor, setNewStageColor] = useState("#3b82f6");

  const handleCreate = async () => {
    if (!newStageTitle.trim()) return;

    try {
      await onCreateStage(newStageTitle);
      setNewStageTitle("");
      setNewStageColor("#3b82f6");
      setIsCreating(false);
    } catch (error) {
      console.error("Erro ao criar estágio:", error);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setNewStageTitle("");
    setNewStageColor("#3b82f6");
  };

  if (isCreating) {
    return (
      <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
        <Label>Nova Etapa</Label>
        <div className="flex gap-2">
          <Input
            value={newStageTitle}
            onChange={(e) => setNewStageTitle(e.target.value)}
            placeholder="Nome da etapa"
            className="flex-1"
          />
          <input
            type="color"
            value={newStageColor}
            onChange={(e) => setNewStageColor(e.target.value)}
            className="w-12 h-10 rounded border border-white/20"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={() => setIsCreating(true)}
      className="w-full bg-gradient-to-r from-ticlin to-ticlin-dark text-black"
    >
      <Plus className="w-4 h-4 mr-2" />
      Nova Etapa
    </Button>
  );
};
