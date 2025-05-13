
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KanbanTag } from "@/types/kanban";
import { X } from "lucide-react";

interface TagBadgeProps {
  tag: KanbanTag;
  onClick?: () => void;
  showRemoveIcon?: boolean;
}

export const TagBadge = ({ tag, onClick, showRemoveIcon = false }: TagBadgeProps) => {
  return (
    <Badge 
      key={tag.id} 
      className={cn(
        "cursor-pointer text-black transition-all duration-200", 
        "hover:ring-2 hover:ring-opacity-50 hover:scale-105",
        tag.color
      )}
      onClick={onClick}
    >
      {tag.name}
      {showRemoveIcon && (
        <span className="ml-1.5 flex items-center text-black/70 hover:text-black">
          <X size={14} />
        </span>
      )}
    </Badge>
  );
};
