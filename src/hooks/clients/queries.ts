import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { Contact } from '@/types/chat';

const CLIENTS_PER_PAGE = 10;

export const useClient = (id: string) => {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar cliente:', error);
        throw new Error(error.message);
      }

      return data as Contact;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*');

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        throw new Error(error.message);
      }

      return data as Contact[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInfiniteClients = (
  searchTerm: string = '',
  filters: any = {},
  enabled: boolean = true
) => {
  return useInfiniteQuery({
    queryKey: ['clients', 'infinite', searchTerm, filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + CLIENTS_PER_PAGE - 1);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.assignedUser) {
        query = query.eq('ownerId', filters.assignedUser);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        throw new Error(error.message);
      }

      return data;
    },
    getNextPageParam: (lastPage: any) => {
      return lastPage?.length === CLIENTS_PER_PAGE ? lastPage.length : undefined;
    },
    initialPageParam: 0, // Adicionado parâmetro obrigatório
    enabled,
    staleTime: 30 * 1000,
  });
};
