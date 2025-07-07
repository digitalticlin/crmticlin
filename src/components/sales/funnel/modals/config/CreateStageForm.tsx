import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save, Palette } from "lucide-react";
import { useSalesFunnelContext } from "../../SalesFunnelProvider";

interface CreateStageFormProps {
  onCreateStage: (title: string, color?: string) => Promise<void>;
}

// Cores predefinidas para as etapas
const PRESET_COLORS = [
  "#3b82f6", // Azul
  "#10b981", // Verde
  "#f59e0b", // Amarelo
  "#ef4444", // Vermelho
  "#8b5cf6", // Roxo
  "#06b6d4", // Ciano
  "#f97316", // Laranja
  "#84cc16", // Lima
  "#ec4899", // Rosa
  "#6b7280"  // Cinza
];

export const CreateStageForm = ({ onCreateStage }: CreateStageFormProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!newStageTitle.trim()) return;

    setIsLoading(true);
    try {
      await onCreateStage(newStageTitle.trim(), selectedColor);
      setNewStageTitle("");
      setSelectedColor(PRESET_COLORS[0]);
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
    setSelectedColor(PRESET_COLORS[0]);
  };

  if (isCreating) {
    return (
      <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="space-y-2">
          <Label>Nome da Etapa</Label>
          <Input
            value={newStageTitle}
            onChange={(e) => setNewStageTitle(e.target.value)}
            placeholder="Ex: Negociação, Contrato, etc."
            className="flex-1"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Cor da Etapa
          </Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color 
                    ? "border-gray-800 scale-110" 
                    : "border-gray-300 hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                disabled={isLoading}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div 
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: selectedColor }}
            />
            <span>Cor selecionada: {selectedColor}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black"
            disabled={isLoading || !newStageTitle.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Criando..." : "Criar Etapa"}
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
