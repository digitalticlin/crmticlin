import { useState, useEffect, useMemo } from 'react';
import { ClientFilters, FilterStats } from '@/types/filters';
import { ClientData } from './types';

// Mock filter options to match expected structure
const mockFilterOptions = {
  tags: [],
  users: [],
  stages: [],
  funnelStages: [], // Added missing property
  responsibleUsers: [] // Added missing property
};

export interface FilterState extends ClientFilters {
  searchQuery: string;
}

export const useAdvancedFilters = (clients: ClientData[]) => {
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    companies: [],
    responsibleUsers: [],
    funnelStages: [],
    funnelIds: [],
    states: [],
    cities: [],
    countries: [],
    searchQuery: '',
  });

  const [filterOptions] = useState(mockFilterOptions);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    
    return clients.filter(client => {
      // Search query filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          client.name.toLowerCase().includes(searchLower) ||
          client.phone.includes(searchLower) ||
          (client.email && client.email.toLowerCase().includes(searchLower)) ||
          (client.company && client.company.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const clientTags = client.tags?.map(tag => tag.id) || [];
        if (!filters.tags.some(tagId => clientTags.includes(tagId))) {
          return false;
        }
      }

      // Companies filter
      if (filters.companies.length > 0) {
        if (!client.company || !filters.companies.includes(client.company)) {
          return false;
        }
      }

      // States filter
      if (filters.states.length > 0) {
        if (!client.state || !filters.states.includes(client.state)) {
          return false;
        }
      }

      // Cities filter
      if (filters.cities.length > 0) {
        if (!client.city || !filters.cities.includes(client.city)) {
          return false;
        }
      }

      // Countries filter
      if (filters.countries.length > 0) {
        if (!client.country || !filters.countries.includes(client.country)) {
          return false;
        }
      }

      return true;
    });
  }, [clients, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.length > 0 ||
      filters.tags.length > 0 ||
      filters.companies.length > 0 ||
      filters.responsibleUsers.length > 0 ||
      filters.funnelStages.length > 0 ||
      filters.funnelIds.length > 0 ||
      filters.states.length > 0 ||
      filters.cities.length > 0 ||
      filters.countries.length > 0
    );
  }, [filters]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearAllFilters = () => {
    setFilters({
      tags: [],
      companies: [],
      responsibleUsers: [],
      funnelStages: [],
      funnelIds: [],
      states: [],
      cities: [],
      countries: [],
      searchQuery: '',
    });
  };

  const addTagFilter = (tagId: string) => {
    setFilters(prev => ({
      ...prev,
      tags: [...prev.tags, tagId]
    }));
  };

  const removeTagFilter = (tagId: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(id => id !== tagId)
    }));
  };

  const addCompanyFilter = (company: string) => {
    setFilters(prev => ({
      ...prev,
      companies: [...prev.companies, company]
    }));
  };

  const removeCompanyFilter = (company: string) => {
    setFilters(prev => ({
      ...prev,
      companies: prev.companies.filter(c => c !== company)
    }));
  };

  const addUserFilter = (userId: string) => {
    setFilters(prev => ({
      ...prev,
      responsibleUsers: [...prev.responsibleUsers, userId]
    }));
  };

  const removeUserFilter = (userId: string) => {
    setFilters(prev => ({
      ...prev,
      responsibleUsers: prev.responsibleUsers.filter(id => id !== userId)
    }));
  };

  const addFunnelFilter = (funnelId: string) => {
    setFilters(prev => ({
      ...prev,
      funnelIds: [...prev.funnelIds, funnelId]
    }));
  };

  const removeFunnelFilter = (funnelId: string) => {
    setFilters(prev => ({
      ...prev,
      funnelIds: prev.funnelIds.filter(id => id !== funnelId)
    }));
  };

  const addStageFilter = (stageId: string) => {
    setFilters(prev => ({
      ...prev,
      funnelStages: [...prev.funnelStages, stageId]
    }));
  };

  const removeStageFilter = (stageId: string) => {
    setFilters(prev => ({
      ...prev,
      funnelStages: prev.funnelStages.filter(id => id !== stageId)
    }));
  };

  // Available filter options based on current data
  const availableOptions = useMemo(() => {
    const uniqueCompanies = [...new Set(clients.map(client => client.company).filter(Boolean))];
    const uniqueStates = [...new Set(clients.map(client => client.state).filter(Boolean))];
    const uniqueCities = [...new Set(clients.map(client => client.city).filter(Boolean))];
    const uniqueCountries = [...new Set(clients.map(client => client.country).filter(Boolean))];
    
    return {
      funnelStages: filterOptions.funnelStages,
      responsibleUsers: filterOptions.responsibleUsers,
      tags: filterOptions.tags,
      companies: uniqueCompanies.map(company => ({ value: company, label: company })),
      states: uniqueStates.map(state => ({ value: state, label: state })),
      cities: uniqueCities.map(city => ({ value: city, label: city })),
      countries: uniqueCountries.map(country => ({ value: country, label: country }))
    };
  }, [filterOptions, clients]);

  return {
    filters,
    setFilters,
    updateFilters,
    clearAllFilters,
    hasActiveFilters,
    filteredClients,
    addTagFilter,
    removeTagFilter,
    addCompanyFilter,
    removeCompanyFilter,
    addUserFilter,
    removeUserFilter,
    addFunnelFilter,
    removeFunnelFilter,
    addStageFilter,
    removeStageFilter,
    availableOptions
  };
};
