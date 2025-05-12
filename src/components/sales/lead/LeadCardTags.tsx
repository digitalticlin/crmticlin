
import { KanbanTag } from "@/types/kanban";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeadCardTagsProps {
  tags: KanbanTag[];
}

export const LeadCardTags = ({ tags }: LeadCardTagsProps) => {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag.id} className={cn("text-black", tag.color)}>
          {tag.name}
        </Badge>
      ))}
    </div>
  );
};
