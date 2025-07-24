import { KanbanTag } from "@/types/kanban";
import { TagBadge } from "@/components/ui/tag-badge";


interface ContactTagsProps {
  tags: KanbanTag[];
}

export const ContactTags = ({ tags }: ContactTagsProps) => {
  // 🐛 DEBUG: Log temporário para verificar re-renderização
  console.log('[ContactTags] 🏷️ Re-renderizando com tags:', {
    count: tags?.length || 0,
    tags: tags?.map(tag => ({ id: tag.id, name: tag.name })) || [],
    timestamp: new Date().toISOString(),
    tagsArray: tags
  });

  if (!tags || tags.length === 0) {
    console.log('[ContactTags] ❌ Nenhuma tag para exibir');
    return null;
  }

  // Mostrar apenas 2 tags + contador
  const visibleTags = tags.slice(0, 2);
  const remainingCount = tags.length - visibleTags.length;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      {visibleTags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          size="sm"
        />
      ))}
      {remainingCount > 0 && (
        <div className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-white/10 text-gray-400">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}; 