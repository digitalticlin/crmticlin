
import { useState, useCallback, useMemo } from 'react';
import { useFilterOptions } from './queries';

export interface FilterState {
  tags: string[];
  funnelStage: string;
  funnelStages: string[];
  funnelIds: string[];
  dateRange: { from?: Date; to?: Date };
  source: string;
  value: { min?: number; max?: number };
  companies: string[];
  responsibleUsers: string[];
  states: string[];
  cities: string[];
  countries: string[];
}

const initialFilters: FilterState = {
  tags: [],
  funnelStage: '',
  funnelStages: [],
  funnelIds: [],
  dateRange: { from: undefined, to: undefined },
  source: '',
  value: { min: undefined, max: undefined },
  companies: [],
  responsibleUsers: [],
  states: [],
  cities: [],
  countries: []
};

export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const { data: filterOptions } = useFilterOptions();

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Tag filter methods
  const addTagFilter = useCallback((tagId: string) => {
    setFilters(prev => ({
      ...prev,
      tags: [...prev.tags, tagId]
    }));
  }, []);

  const removeTagFilter = useCallback((tagId: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(id => id !== tagId)
    }));
  }, []);

  // User filter methods
  const addUserFilter = useCallback((userId: string) => {
    setFilters(prev => ({
      ...prev,
      responsibleUsers: [...prev.responsibleUsers, userId]
    }));
  }, []);

  const removeUserFilter = useCallback((userId: string) => {
    setFilters(prev => ({
      ...prev,
      responsibleUsers: prev.responsibleUsers.filter(id => id !== userId)
    }));
  }, []);

  // Funnel filter methods
  const addFunnelFilter = useCallback((funnelId: string) => {
    setFilters(prev => ({
      ...prev,
      funnelIds: [...prev.funnelIds, funnelId]
    }));
  }, []);

  const removeFunnelFilter = useCallback((funnelId: string) => {
    setFilters(prev => ({
      ...prev,
      funnelIds: prev.funnelIds.filter(id => id !== funnelId)
    }));
  }, []);

  // Stage filter methods
  const addStageFilter = useCallback((stageId: string) => {
    setFilters(prev => ({
      ...prev,
      funnelStages: [...prev.funnelStages, stageId]
    }));
  }, []);

  const removeStageFilter = useCallback((stageId: string) => {
    setFilters(prev => ({
      ...prev,
      funnelStages: prev.funnelStages.filter(id => id !== stageId)
    }));
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.tags.length > 0) count++;
    if (filters.funnelStage) count++;
    if (filters.funnelStages.length > 0) count++;
    if (filters.funnelIds.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.source) count++;
    if (filters.value.min !== undefined || filters.value.max !== undefined) count++;
    if (filters.companies.length > 0) count++;
    if (filters.responsibleUsers.length > 0) count++;
    if (filters.states.length > 0) count++;
    if (filters.cities.length > 0) count++;
    if (filters.countries.length > 0) count++;
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

    if (filters.funnelStages.length > 0) {
      queryFilters.funnelStages = filters.funnelStages;
    }

    if (filters.funnelIds.length > 0) {
      queryFilters.funnelIds = filters.funnelIds;
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

    if (filters.companies.length > 0) {
      queryFilters.companies = filters.companies;
    }

    if (filters.responsibleUsers.length > 0) {
      queryFilters.responsibleUsers = filters.responsibleUsers;
    }

    if (filters.states.length > 0) {
      queryFilters.states = filters.states;
    }

    if (filters.cities.length > 0) {
      queryFilters.cities = filters.cities;
    }

    if (filters.countries.length > 0) {
      queryFilters.countries = filters.countries;
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
    updateFilter,
    resetFilters,
    activeFilterCount,
    buildQueryFilters,
    filterOptions: mockFilterOptions,
    // Individual filter methods
    addTagFilter,
    removeTagFilter,
    addUserFilter,
    removeUserFilter,
    addFunnelFilter,
    removeFunnelFilter,
    addStageFilter,
    removeStageFilter
  };
};
