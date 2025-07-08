
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickTagCreatorProps {
  onCreateTag: (name: string, color: string) => void;
  isCreating: boolean;
  setIsCreating: (creating: boolean) => void;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange  
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#6b7280", // gray
  "#000000"  // black
];

export const QuickTagCreator = ({ onCreateTag, isCreating, setIsCreating }: QuickTagCreatorProps) => {
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[4]); // blue default

  const handleCreate = () => {
    if (tagName.trim()) {
      onCreateTag(tagName.trim(), selectedColor);
      setTagName("");
      setSelectedColor(PRESET_COLORS[4]);
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setTagName("");
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setTagName("");
    setSelectedColor(PRESET_COLORS[4]);
    setIsCreating(false);
  };

  if (!isCreating) {
    return (
      <Button
        onClick={() => setIsCreating(true)}
        variant="outline"
        className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 border-dashed"
      >
        + Nova Etiqueta
      </Button>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/20">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Nome da etiqueta"
          value={tagName}
          onChange={(e) => setTagName(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/60"
          autoFocus
        />
        
        {/* Preview da cor */}
        <div
          className="w-8 h-8 rounded-full border-2 border-white/50"
          style={{ backgroundColor: selectedColor }}
        />
      </div>

      {/* Paleta de cores */}
      <div className="flex gap-2 justify-center">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className={cn(
              "w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110",
              selectedColor === color 
                ? "border-white scale-110" 
                : "border-white/30 hover:border-white/60"
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          onClick={handleCreate}
          disabled={!tagName.trim()}
          className="flex-1 bg-green-500/80 hover:bg-green-600/80 text-white"
        >
          Criar
        </Button>
        <Button
          onClick={handleCancel}
          variant="outline"
          className="px-4 bg-white/10 border-white/30 text-white hover:bg-white/20"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};
