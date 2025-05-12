
import { KanbanTag } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { Tags } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TagSelectorProps {
  availableTags: KanbanTag[];
  selectedTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
}

export const TagSelector = ({
  availableTags,
  selectedTags,
  onToggleTag,
}: TagSelectorProps) => {
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
          <div className="space-y-1">
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
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
