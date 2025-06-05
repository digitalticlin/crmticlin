
import { Badge } from "@/components/ui/badge";
import { KanbanTag } from "@/types/kanban";

interface LeadCardTagsProps {
  tags: KanbanTag[];
}

export const LeadCardTags = ({ tags }: LeadCardTagsProps) => {
  if (!tags || tags.length === 0) return null;

  // Limit to show maximum 2 tags, with indicator if there are more
  const visibleTags = tags.slice(0, 2);
  const remainingCount = tags.length - visibleTags.length;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleTags.map((tag) => (
        <Badge
          key={tag.id}
          style={{ backgroundColor: tag.color, color: 'white' }}
          className="text-xs px-2 py-1 rounded-lg border-0 truncate max-w-20"
          title={tag.name}
        >
          {tag.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className="text-xs px-2 py-1 rounded-lg bg-white/30 border-white/40 text-gray-700"
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
};
