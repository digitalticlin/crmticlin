
import { KanbanTag } from "@/types/kanban";
import { Tags, Plus } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TagBadge } from "./tags/TagBadge";
import { TagList } from "./tags/TagList";
import { CreateTagForm } from "./tags/CreateTagForm";

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
  
  const handleCreateTag = (name: string, color: string) => {
    if (onCreateTag) {
      onCreateTag(name, color);
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
            <TagBadge
              key={tag.id}
              tag={tag}
              onClick={() => onToggleTag(tag.id)}
              showRemoveIcon
            />
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
            
            <TagList
              tags={availableTags}
              selectedTags={selectedTags}
              onToggleTag={onToggleTag}
            />
            
            {isCreatingTag ? (
              <CreateTagForm
                onCancel={() => setIsCreatingTag(false)}
                onCreateTag={handleCreateTag}
              />
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
