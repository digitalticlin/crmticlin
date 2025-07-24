import React, { memo } from 'react';
import { KanbanTag } from '@/types/kanban';
import { TagBadge } from '@/components/sales/tags/TagBadge';

interface ContactTagsProps {
  tags: KanbanTag[];
}

// ✅ OTIMIZAÇÃO: Memoização para evitar re-renders desnecessários
export const ContactTags = memo(({ tags }: ContactTagsProps) => {
  if (!tags || tags.length === 0) {
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
}, (prevProps, nextProps) => {
  // ✅ OTIMIZAÇÃO: Comparação inteligente de arrays de tags
  const prevTags = prevProps.tags || [];
  const nextTags = nextProps.tags || [];
  
  // Se o tamanho mudou, precisa re-renderizar
  if (prevTags.length !== nextTags.length) {
    return false;
  }
  
  // Comparar apenas os campos relevantes para UI (id, name, color)
  const tagsEqual = prevTags.every((prevTag, index) => {
    const nextTag = nextTags[index];
    return nextTag && 
           prevTag.id === nextTag.id && 
           prevTag.name === nextTag.name && 
           prevTag.color === nextTag.color;
  });
  
  return tagsEqual; // true = não re-renderizar, false = re-renderizar
});

ContactTags.displayName = 'ContactTags'; 