import { KanbanTag } from "@/types/kanban";
import { TagBadge } from "@/components/ui/tag-badge";

interface LeadCardTagsProps {
  tags: KanbanTag[];
  maxTags?: number;
}

export const LeadCardTags = ({ tags, maxTags = 2 }: LeadCardTagsProps) => {
  // Se não há tags, não renderizar nada (não mostrar "sem tags")
  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxTags);
  const hiddenCount = tags.length - maxTags;
  const showMoreIndicator = hiddenCount > 0;

  return (
    <div className="flex items-center gap-1 overflow-hidden">
      {visibleTags.map((tag) => (
        <div key={tag.id} className="flex-shrink-0 max-w-[80px]">
          <TagBadge
            tag={{
              ...tag,
              // Truncar nome da tag se muito longo
              name: tag.name.length > 10 ? `${tag.name.substring(0, 8)}...` : tag.name
            }}
            size="sm"
          />
        </div>
      ))}
      {showMoreIndicator && (
        <span className="flex-shrink-0 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full font-medium">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};
