import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanTag } from "@/types/kanban";

interface TagBadgeProps {
  tag: KanbanTag;
  onClick?: () => void;
  showRemoveIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const TagBadge = ({ 
  tag, 
  onClick, 
  showRemoveIcon = false, 
  className,
  size = 'md'
}: TagBadgeProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md text-white font-medium",
        size === 'sm' ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        "transition-all duration-200",
        onClick && "cursor-pointer hover:opacity-90",
        className
      )}
      style={{
        backgroundColor: `${tag.color}cc`, // 80% opacidade
      }}
      onClick={onClick}
    >
      <span>{tag.name}</span>
      {showRemoveIcon && (
        <X className={cn(
          "hover:text-white/80",
          size === 'sm' ? "h-2.5 w-2.5" : "h-3 w-3"
        )} />
      )}
    </div>
  );
}; 