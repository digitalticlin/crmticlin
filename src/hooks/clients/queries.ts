import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientData } from "./types";

export const useDefaultWhatsAppInstance = (userId: string | null) => {
  return useQuery({
    queryKey: ['defaultWhatsAppInstance', userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single();

      if (error) {
        console.error('[Default WhatsApp Instance Query] ❌ Erro:', error);
        throw error;
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 30000,
  });
};

export const useClientsQuery = (userId: string | null, searchQuery: string = '') => {
  return useInfiniteQuery({
    queryKey: ['clients', userId, searchQuery],
    queryFn: async ({ pageParam }) => {
      if (!userId) {
        return {
          data: [],
          nextCursor: undefined,
          hasMore: false,
          totalCount: 0
        };
      }

      const limit = 20;
      const offset = pageParam || 0;

      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('[Clients Query] ❌ Erro:', error);
        throw error;
      }

      const hasMore = (data?.length || 0) === limit;
      const nextCursor = hasMore ? offset + limit : undefined;

      return {
        data: data || [],
        nextCursor,
        hasMore,
        totalCount: count || 0
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
    staleTime: 30000,
  });
};

export const useClientQuery = (clientId: string | null) => {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) {
        return null;
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) {
        console.error('[Client Query] ❌ Erro:', error);
        throw error;
      }

      return data;
    },
    enabled: !!clientId,
    staleTime: 30000,
  });
};
