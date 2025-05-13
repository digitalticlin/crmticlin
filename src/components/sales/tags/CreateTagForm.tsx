
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, Plus } from "lucide-react";
import { useState } from "react";
import { TagColorSelector } from "./TagColorSelector";

interface CreateTagFormProps {
  onCancel: () => void;
  onCreateTag: (name: string, color: string) => void;
}

export const CreateTagForm = ({ onCancel, onCreateTag }: CreateTagFormProps) => {
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-blue-400");

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim(), selectedColor);
      setNewTagName("");
      setSelectedColor("bg-blue-400");
    }
  };

  return (
    <div className="space-y-2 border-t pt-2">
      <h4 className="text-sm font-medium flex items-center">
        <Plus className="h-3.5 w-3.5 mr-1" />
        Nova Etiqueta
      </h4>
      <Input
        placeholder="Nome da etiqueta"
        value={newTagName}
        onChange={(e) => setNewTagName(e.target.value)}
        className="text-sm h-8"
        autoFocus
      />
      
      <TagColorSelector 
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
      />
      
      <div className="flex justify-end gap-2 mt-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          Cancelar
        </Button>
        <Button 
          size="sm"
          className="bg-ticlin hover:bg-ticlin/90 text-black h-7 text-xs"
          onClick={handleCreateTag}
          disabled={!newTagName.trim()}
        >
          Criar
        </Button>
      </div>
    </div>
  );
};
