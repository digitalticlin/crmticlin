
import { KanbanTag } from "@/types/kanban";
import { cn } from "@/lib/utils";

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
            "px-2.5 py-0.5 text-xs font-semibold rounded-full backdrop-blur-[2px] shadow-md border border-white/20 bg-white/40 text-black transition-all duration-200",
            tag.color
          )}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
};
