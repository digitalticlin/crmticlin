
import { useState, useCallback, useMemo } from 'react';
import { useFilterOptions } from './queries';

export interface FilterState {
  tags: string[];
  funnelStage: string;
  dateRange: { from?: Date; to?: Date };
  source: string;
  value: { min?: number; max?: number };
}

const initialFilters: FilterState = {
  tags: [],
  funnelStage: '',
  dateRange: { from: undefined, to: undefined },
  source: '',
  value: { min: undefined, max: undefined }
};

export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const { data: filterOptions } = useFilterOptions();

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.tags.length > 0) count++;
    if (filters.funnelStage) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.source) count++;
    if (filters.value.min !== undefined || filters.value.max !== undefined) count++;
    return count;
  }, [filters]);

  const buildQueryFilters = useCallback(() => {
    const queryFilters: any = {};

    if (filters.tags.length > 0) {
      queryFilters.tags = filters.tags;
    }

    if (filters.funnelStage) {
      queryFilters.funnelStage = filters.funnelStage;
    }

    if (filters.dateRange.from) {
      queryFilters.createdAfter = filters.dateRange.from.toISOString();
    }

    if (filters.dateRange.to) {
      queryFilters.createdBefore = filters.dateRange.to.toISOString();
    }

    if (filters.source) {
      queryFilters.source = filters.source;
    }

    if (filters.value.min !== undefined) {
      queryFilters.minValue = filters.value.min;
    }

    if (filters.value.max !== undefined) {
      queryFilters.maxValue = filters.value.max;
    }

    return queryFilters;
  }, [filters]);

  // Mock filter options to prevent errors
  const mockFilterOptions = useMemo(() => ({
    tags: filterOptions?.tags || [],
    funnelStages: filterOptions?.funnelStages || [],
    responsibleUsers: filterOptions?.responsibleUsers || []
  }), [filterOptions]);

  return {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    activeFilterCount,
    buildQueryFilters,
    filterOptions: mockFilterOptions
  };
};
