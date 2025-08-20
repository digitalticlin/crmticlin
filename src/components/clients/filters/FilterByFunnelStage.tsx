import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Columns } from 'lucide-react';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

interface FilterByFunnelStageProps {
  stages: { id: string; title: string }[];
  isLoading?: boolean;
}

export const FilterByFunnelStage = ({ stages, isLoading }: FilterByFunnelStageProps) => {
  const { filters, addStageFilter, removeStageFilter } = useAdvancedFilters();

  const handleStageToggle = (stageId: string, checked: boolean) => {
    if (checked) {
      addStageFilter(stageId);
    } else {
      removeStageFilter(stageId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Columns className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Etapas do Funil</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Columns className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Etapas do Funil</span>
        </div>
        <p className="text-xs text-gray-500">Nenhuma etapa encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Columns className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Etapas do Funil</span>
        {filters.funnelStages.length > 0 && (
          <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
            {filters.funnelStages.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {stages.map(stage => (
          <div key={stage.id} className="flex items-center space-x-2">
            <Checkbox
              id={`stage-${stage.id}`}
              checked={filters.funnelStages.includes(stage.id)}
              onCheckedChange={(checked) => handleStageToggle(stage.id, !!checked)}
            />
            <label
              htmlFor={`stage-${stage.id}`}
              className="text-sm cursor-pointer truncate"
              title={stage.title}
            >
              {stage.title}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};