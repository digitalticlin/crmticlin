
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

// Temporarily disable clients queries since the table doesn't exist
export const useClientsQuery = (userId: string | null, searchQuery: string = '') => {
  return useInfiniteQuery({
    queryKey: ['clients', userId, searchQuery],
    queryFn: async ({ pageParam }) => {
      // Return empty data since clients table doesn't exist
      return {
        data: [],
        nextCursor: undefined,
        hasMore: false,
        totalCount: 0
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: false, // Disable until clients table is created
    staleTime: 30000,
  });
};

export const useClientQuery = (clientId: string | null) => {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      // Return null since clients table doesn't exist
      return null;
    },
    enabled: false, // Disable until clients table is created
    staleTime: 30000,
  });
};
