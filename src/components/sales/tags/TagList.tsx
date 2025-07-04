import { useState } from "react";
import { KanbanTag } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { getFunnelStageColor } from "@/utils/tagColors";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTagDialog } from "./CreateTagDialog";

interface TagListProps {
  tags: KanbanTag[];
  selectedTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onCreateTag?: (name: string, color: string) => void;
}

export const TagList = ({ 
  tags, 
  selectedTags, 
  onToggleTag,
  onCreateTag 
}: TagListProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-1.5">
        {tags.map((tag) => {
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
                  getFunnelStageColor(tag.color)
                )}
              />
              <span className="text-sm truncate">{tag.name}</span>
            </div>
          );
        })}

        {onCreateTag && (
          <Button
            variant="ghost"
            className="flex items-center gap-2 p-1.5"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Nova Tag</span>
          </Button>
        )}
      </div>

      {onCreateTag && (
        <CreateTagDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onCreateTag={onCreateTag}
        />
      )}
    </>
  );
};
