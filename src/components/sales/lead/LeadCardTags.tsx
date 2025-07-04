import { KanbanTag } from "@/types/kanban";
import { TagBadge } from "@/components/ui/tag-badge";

interface LeadCardTagsProps {
  tags: KanbanTag[];
}

export const LeadCardTags = ({ tags }: LeadCardTagsProps) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          size="sm"
        />
      ))}
    </div>
  );
};
