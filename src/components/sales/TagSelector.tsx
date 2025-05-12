
import { KanbanTag } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { Tags, Plus, Palette } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface TagSelectorProps {
  availableTags: KanbanTag[];
  selectedTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onCreateTag?: (name: string, color: string) => void;
}

export const TagSelector = ({
  availableTags,
  selectedTags,
  onToggleTag,
  onCreateTag,
}: TagSelectorProps) => {
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-blue-400");
  
  const availableColors = [
    "bg-blue-400", 
    "bg-red-400", 
    "bg-green-400", 
    "bg-purple-400", 
    "bg-yellow-400", 
    "bg-amber-400", 
    "bg-emerald-400", 
    "bg-pink-400", 
    "bg-indigo-400", 
    "bg-teal-400", 
    "bg-orange-400", 
    "bg-cyan-400"
  ];
  
  const handleCreateTag = () => {
    if (newTagName.trim() && onCreateTag) {
      onCreateTag(newTagName.trim(), selectedColor);
      setNewTagName("");
      setSelectedColor("bg-blue-400");
      setIsCreatingTag(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <Tags className="h-4 w-4 mr-1" /> Etiquetas
      </h3>
      
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <Badge 
              key={tag.id} 
              className={cn("cursor-pointer text-black", tag.color)}
              onClick={() => onToggleTag(tag.id)}
            >
              {tag.name}
              <span className="ml-1 text-black/70">×</span>
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Nenhuma etiqueta selecionada</span>
        )}
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-1 w-full flex justify-between items-center border-dashed"
          >
            <span>Adicionar etiquetas</span>
            <Tags className="h-3.5 w-3.5 ml-1 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-3">
            <h4 className="text-sm font-medium mb-2">Todas as Etiquetas</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.some(t => t.id === tag.id);
                return (
                  <div
                    key={tag.id}
                    onClick={() => onToggleTag(tag.id)}
                    className={cn(
                      "flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-colors",
                      isSelected ? "bg-secondary" : "hover:bg-secondary/50"
                    )}
                  >
                    <div 
                      className={cn(
                        "w-3 h-3 rounded-full", 
                        tag.color
                      )}
                    />
                    <span className="text-sm truncate">{tag.name}</span>
                  </div>
                );
              })}
            </div>
            
            {isCreatingTag ? (
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
                <div>
                  <h5 className="text-xs font-medium mb-1.5 flex items-center">
                    <Palette className="h-3 w-3 mr-1" />
                    Cor
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {availableColors.map((color) => (
                      <div
                        key={color}
                        className={cn(
                          "w-5 h-5 rounded-full cursor-pointer",
                          color,
                          selectedColor === color && "ring-2 ring-offset-1 ring-black/50"
                        )}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setIsCreatingTag(false)}
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
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-dashed flex justify-center items-center"
                onClick={() => setIsCreatingTag(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Nova Etiqueta</span>
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
