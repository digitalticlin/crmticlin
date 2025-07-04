import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TagBadge } from "@/components/ui/tag-badge";
import { KanbanTag } from "@/types/kanban";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagList } from "@/components/ui/tag-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface ChatHeaderTagsProps {
  leadTags: KanbanTag[];
  availableTags: KanbanTag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  isLoading?: boolean;
}

export const ChatHeaderTags = ({
  leadTags,
  availableTags,
  onAddTag,
  onRemoveTag,
  isLoading = false
}: ChatHeaderTagsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleTag = (tagId: string) => {
    if (leadTags.some(tag => tag.id === tagId)) {
      onRemoveTag(tagId);
    } else {
      onAddTag(tagId);
    }
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="px-4 py-2 flex items-center gap-2 border-t border-white/20">
      <div className="flex flex-wrap gap-1 flex-1">
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : leadTags.length > 0 ? (
          leadTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onClick={() => onRemoveTag(tag.id)}
              showRemoveIcon
              size="sm"
            />
          ))
        ) : (
          <span className="text-xs text-gray-500">Sem tags</span>
        )}
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <TagList
            tags={availableTags}
            selectedTags={leadTags}
            onToggleTag={onAddTag}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}; 