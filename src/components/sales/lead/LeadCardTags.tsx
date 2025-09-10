import { KanbanTag } from "@/types/kanban";
import { TagBadge } from "@/components/ui/tag-badge";

interface LeadCardTagsProps {
  tags: KanbanTag[];
  maxTags?: number;
}

export const LeadCardTags = ({ tags, maxTags = Infinity }: LeadCardTagsProps) => {
  if (!tags || tags.length === 0) return null;

  const visibleTags = tags.slice(0, maxTags);
  const hiddenCount = tags.length - maxTags;
  const showMoreIndicator = hiddenCount > 0;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          size="sm"
        />
      ))}
      {showMoreIndicator && (
        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
          + {hiddenCount}
        </span>
      )}
    </div>
  );
};
