import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilterOptions, useFilteredClientsQuery } from './queries';
import { ClientFilters, FilterSummary } from '@/types/filters';

const initialFilters: ClientFilters = {
  tags: [],
  companies: [],
  responsibleUsers: [],
  funnelStages: [],
  dateRange: undefined,
  funnelIds: [],
  states: [],
  cities: [],
  countries: [],
};

export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState<ClientFilters>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Buscar opções disponíveis para filtros
  const filterOptionsQuery = useFilterOptions(user?.id || null);
  
  // Buscar clientes filtrados
  const filteredClientsQuery = useFilteredClientsQuery(
    user?.id || null,
    searchQuery,
    filters
  );

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.tags.length > 0 ||
      filters.companies.length > 0 ||
      filters.responsibleUsers.length > 0 ||
      filters.funnelStages.length > 0 ||
      filters.dateRange !== undefined ||
      // Filtros antigos para compatibilidade
      filters.funnelIds.length > 0 ||
      filters.states.length > 0 ||
      filters.cities.length > 0 ||
      filters.countries.length > 0
    );
  }, [filters]);

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    if (filters.tags.length > 0) count++;
    if (filters.companies.length > 0) count++;
    if (filters.responsibleUsers.length > 0) count++;
    if (filters.funnelStages.length > 0) count++;
    if (filters.dateRange) count++;
    // Filtros antigos para compatibilidade
    if (filters.funnelIds.length > 0) count++;
    if (filters.states.length > 0) count++;
    if (filters.cities.length > 0) count++;
    if (filters.countries.length > 0) count++;
    
    return count;
  }, [filters]);

  // Gerar resumo dos filtros
  const filterSummary = useMemo((): FilterSummary => {
    const activeFilters: FilterSummary['activeFilters'] = [];

    if (filters.tags.length > 0) {
      const tagNames = filters.tags.map(tagId => {
        const tag = filterOptionsQuery.data?.tags.find(t => t.id === tagId);
        return tag?.name || tagId;
      }).join(', ');
      activeFilters.push({
        type: 'tags',
        label: 'Tags',
        value: tagNames
      });
    }

    if (filters.companies.length > 0) {
      activeFilters.push({
        type: 'companies',
        label: 'Empresa',
        value: filters.companies.join(', ')
      });
    }

    if (filters.responsibleUsers.length > 0) {
      const userNames = filters.responsibleUsers.map(userId => {
        const user = filterOptionsQuery.data?.responsibleUsers.find(u => u.id === userId);
        return user?.name || userId;
      }).join(', ');
      activeFilters.push({
        type: 'responsibleUsers',
        label: 'Responsáveis',
        value: userNames
      });
    }

    if (filters.funnelIds.length > 0) {
      const funnelNames = filters.funnelIds.map(funnelId => {
        const funnel = filterOptionsQuery.data?.funnelIds.find(f => f.id === funnelId);
        return funnel?.name || funnelId;
      }).join(', ');
      activeFilters.push({
        type: 'funnelIds',
        label: 'Funis',
        value: funnelNames
      });
    }

    if (filters.funnelStages.length > 0) {
      const stageNames = filters.funnelStages.map(stageId => {
        const stage = filterOptionsQuery.data?.funnelStages.find(s => s.id === stageId);
        return (stage as any)?.title || (stage as any)?.name || stageId;
      }).join(', ');
      activeFilters.push({
        type: 'funnelStages',
        label: 'Etapas',
        value: stageNames
      });
    }

    if (filters.states.length > 0) {
      activeFilters.push({
        type: 'states',
        label: 'Estados',
        value: filters.states.join(', ')
      });
    }

    if (filters.cities.length > 0) {
      activeFilters.push({
        type: 'cities',
        label: 'Cidades',
        value: filters.cities.join(', ')
      });
    }

    if (filters.countries.length > 0) {
      activeFilters.push({
        type: 'countries',
        label: 'Países',
        value: filters.countries.join(', ')
      });
    }

    if (filters.dateRange) {
      let value = '';
      if (filters.dateRange.from && filters.dateRange.to) {
        value = `${filters.dateRange.from.toLocaleDateString('pt-BR')} - ${filters.dateRange.to.toLocaleDateString('pt-BR')}`;
      } else if (filters.dateRange.from) {
        value = `A partir de ${filters.dateRange.from.toLocaleDateString('pt-BR')}`;
      } else if (filters.dateRange.to) {
        value = `Até ${filters.dateRange.to.toLocaleDateString('pt-BR')}`;
      }
      activeFilters.push({
        type: 'dateRange',
        label: 'Data de Criação',
        value
      });
    }

    return {
      totalFilters: activeFiltersCount,
      activeFilters
    };
  }, [filters, filterOptionsQuery.data, activeFiltersCount]);

  // Funções para atualizar filtros
  const updateFilter = useCallback(<K extends keyof ClientFilters>(
    key: K,
    value: ClientFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

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

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const removeFilter = useCallback((type: keyof ClientFilters) => {
    setFilters(prev => ({
      ...prev,
      [type]: type === 'tags' || type === 'companies' || type === 'responsibleUsers' || type === 'funnelIds' || type === 'funnelStages' || type === 'states' || type === 'cities' || type === 'countries' 
        ? [] 
        : undefined
    }));
  }, []);

  return {
    // Estado
    filters,
    isOpen,
    setIsOpen,
    searchQuery,
    setSearchQuery,
    hasActiveFilters,
    activeFiltersCount,
    filterSummary,

    // Dados
    filterOptions: filterOptionsQuery.data,
    filteredClients: filteredClientsQuery.data || [],
    isLoadingOptions: filterOptionsQuery.isLoading,
    isLoadingClients: filteredClientsQuery.isLoading,

    // Ações
    updateFilter,
    addTagFilter,
    removeTagFilter,
    addUserFilter,
    removeUserFilter,
    addFunnelFilter,
    removeFunnelFilter,
    addStageFilter,
    removeStageFilter,
    clearFilters,
    removeFilter,
  };
};