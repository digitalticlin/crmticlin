
import { useQuery } from '@tanstack/react-query';
// Mock implementation for missing queries

export const useFilteredClientsQuery = (filters: any) => {
  return useQuery({
    queryKey: ['filtered-clients', filters],
    queryFn: () => Promise.resolve([]),
    enabled: false
  });
};

export const useFilterOptions = () => {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: () => Promise.resolve({
      tags: [],
      funnelStages: [],
      responsibleUsers: []
    }),
    enabled: false
  });
};
