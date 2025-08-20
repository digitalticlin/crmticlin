import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag } from 'lucide-react';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';
import { ClientTag } from '@/hooks/clients/types';

interface FilterByTagsProps {
  tags: ClientTag[];
  isLoading?: boolean;
}

export const FilterByTags = ({ tags, isLoading }: FilterByTagsProps) => {
  const { filters, addTagFilter, removeTagFilter } = useAdvancedFilters();

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (checked) {
      addTagFilter(tagId);
    } else {
      removeTagFilter(tagId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Tags</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Tags</span>
        </div>
        <p className="text-xs text-gray-500">Nenhuma tag encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Tags</span>
        {filters.tags.length > 0 && (
          <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
            {filters.tags.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {tags.map(tag => (
          <div key={tag.id} className="flex items-center space-x-2">
            <Checkbox
              id={`tag-${tag.id}`}
              checked={filters.tags.includes(tag.id)}
              onCheckedChange={(checked) => handleTagToggle(tag.id, !!checked)}
            />
            <label
              htmlFor={`tag-${tag.id}`}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <div
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: tag.color }}
              />
              <span>{tag.name}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};