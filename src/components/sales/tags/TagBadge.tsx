
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { KanbanTag } from "@/types/kanban";

interface TagBadgeProps {
  tag: KanbanTag;
  onClick?: () => void;
  showRemoveIcon?: boolean;
}

export const TagBadge = ({ tag, onClick, showRemoveIcon = false }: TagBadgeProps) => {
  return (
    <Badge 
      key={tag.id} 
      className={cn("cursor-pointer text-black", tag.color)}
      onClick={onClick}
    >
      {tag.name}
      {showRemoveIcon && <span className="ml-1 text-black/70">×</span>}
    </Badge>
  );
};
