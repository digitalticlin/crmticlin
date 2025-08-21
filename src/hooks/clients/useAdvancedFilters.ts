import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FilterOption {
  id: string;
  name: string;
}

interface AdvancedFilters {
  funnelId?: string;
  stageId?: string;
  tagIds?: string[];
  salesPersonId?: string;
  dateRange?: { from: string; to: string };
}

export const useAdvancedFilters = () => {
  const [filters, setFilters] = useState<AdvancedFilters>({});

  const { data: funnels = [] } = useQuery({
    queryKey: ['funnels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching funnels:', error);
        return [];
      }

      return data || [];
    }
  });

  const { data: stages = [] } = useQuery({
    queryKey: ['stages', filters.funnelId],
    queryFn: async () => {
      if (!filters.funnelId) return [];

      const { data, error } = await supabase
        .from('kanban_stages')
        .select('id, title')
        .eq('funnel_id', filters.funnelId)
        .order('order_position');

      if (error) {
        console.error('Error fetching stages:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!filters.funnelId
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .order('name');

      if (error) {
        console.error('Error fetching tags:', error);
        return [];
      }

      return data || [];
    }
  });

  const { data: salesPersons = [] } = useQuery({
    queryKey: ['sales-persons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name') // Fix: Use full_name instead of name
        .eq('role', 'admin');

      if (error) {
        console.error('Error fetching sales persons:', error);
        return [];
      }

      // Fix: Map correctly and handle errors
      return (data || []).map((person: any) => ({
        id: person.id,
        name: person.full_name || 'Sem nome'
      }));
    }
  });

  const setFilter = (filterName: keyof AdvancedFilters, value: any) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    filters,
    setFilter,
    clearFilters,
    funnels: funnels as FilterOption[],
    stages: stages as FilterOption[],
    tags: tags as { id: string; name: string; color: string }[],
    salesPersons: salesPersons as FilterOption[],
  };
};
