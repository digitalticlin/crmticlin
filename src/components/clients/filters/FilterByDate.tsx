import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays } from 'lucide-react';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

export const FilterByDate = () => {
  const { filters, updateFilter } = useAdvancedFilters();

  const handleQuickDate = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    updateFilter('dateRange', { from, to });
  };

  const clearDateFilter = () => {
    updateFilter('dateRange', undefined);
  };

  const hasDateFilter = filters.dateRange !== undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Data de Criação</span>
        {hasDateFilter && (
          <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
            1
          </Badge>
        )}
      </div>

      {/* Quick Date Filters */}
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickDate(7)}
          className="h-7 text-xs"
        >
          <CalendarDays className="h-3 w-3 mr-1" />
          7 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickDate(30)}
          className="h-7 text-xs"
        >
          30 dias
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickDate(90)}
          className="h-7 text-xs"
        >
          3 meses
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickDate(365)}
          className="h-7 text-xs"
        >
          1 ano
        </Button>
      </div>

      {/* Current Filter Display */}
      {hasDateFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-800">Período Selecionado:</p>
              <p className="text-xs text-blue-700">
                {filters.dateRange?.from?.toLocaleDateString('pt-BR')} - {filters.dateRange?.to?.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateFilter}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              ×
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};