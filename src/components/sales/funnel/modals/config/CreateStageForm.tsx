
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save } from "lucide-react";
import { useSalesFunnelContext } from "../../SalesFunnelProvider";

interface CreateStageFormProps {
  onCreateStage: (title: string) => Promise<void>;
}

export const CreateStageForm = ({ onCreateStage }: CreateStageFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!newStageTitle.trim()) return;

    setIsLoading(true);
    try {
      await onCreateStage(newStageTitle.trim());
      setNewStageTitle("");
      setIsCreating(false);
    } catch (error) {
      console.error("Erro ao criar estágio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setNewStageTitle("");
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
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black"
            disabled={isLoading || !newStageTitle.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
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
