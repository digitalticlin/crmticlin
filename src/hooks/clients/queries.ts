import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClientsQuery = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    },
    enabled: true,
    staleTime: 30000
  });
};

export const useInfiniteClientsQuery = (filters: any) => {
  return useInfiniteQuery({
    queryKey: ['clients-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const { data, error, count } = await supabase
          .from('leads')
          .select('*', { count: 'exact' })
          .range(pageParam, pageParam + 49)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return {
          data: data || [],
          nextCursor: (data?.length === 50) ? pageParam + 50 : undefined,
          hasMore: (data?.length === 50),
          totalCount: count || 0 // Fix: Add totalCount property
        };
      } catch (error) {
        console.error('Error fetching clients:', error);
        return {
          data: [],
          nextCursor: undefined,
          hasMore: false,
          totalCount: 0 // Fix: Add totalCount for error case
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0, // Fix: Add required initialPageParam
    enabled: true,
    staleTime: 30000
  });
};

export const useClientByIdQuery = (id: string) => {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data || null;
    },
    enabled: !!id,
    staleTime: 30000
  });
};
