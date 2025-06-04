
import { KanbanTag } from "@/types/kanban";
import { cn } from "@/lib/utils";
import { getTagStyleClasses } from "@/utils/tagColors";

interface LeadCardTagsProps {
  tags: KanbanTag[];
}

export const LeadCardTags = ({ tags }: LeadCardTagsProps) => {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className={cn(
            "px-2.5 py-0.5 text-xs font-semibold rounded-full backdrop-blur-[2px] shadow-md transition-all duration-200",
            getTagStyleClasses(tag.color)
          )}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
};
