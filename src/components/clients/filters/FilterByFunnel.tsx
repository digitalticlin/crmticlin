import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter } from 'lucide-react';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

interface FilterByFunnelProps {
  funnels: { id: string; name: string }[];
  isLoading?: boolean;
}

export const FilterByFunnel = ({ funnels, isLoading }: FilterByFunnelProps) => {
  const { filters, addFunnelFilter, removeFunnelFilter } = useAdvancedFilters();

  const handleFunnelToggle = (funnelId: string, checked: boolean) => {
    if (checked) {
      addFunnelFilter(funnelId);
    } else {
      removeFunnelFilter(funnelId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Funis</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!funnels || funnels.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Funis</span>
        </div>
        <p className="text-xs text-gray-500">Nenhum funil encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Funis</span>
        {filters.funnelIds.length > 0 && (
          <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
            {filters.funnelIds.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {funnels.map(funnel => (
          <div key={funnel.id} className="flex items-center space-x-2">
            <Checkbox
              id={`funnel-${funnel.id}`}
              checked={filters.funnelIds.includes(funnel.id)}
              onCheckedChange={(checked) => handleFunnelToggle(funnel.id, !!checked)}
            />
            <label
              htmlFor={`funnel-${funnel.id}`}
              className="text-sm cursor-pointer truncate"
              title={funnel.name}
            >
              {funnel.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};