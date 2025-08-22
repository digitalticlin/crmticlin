import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase";
import { ClientData } from "@/types/clients";

interface Filters {
  search?: string;
  funnel_id?: string;
  tags?: string[];
}

const PAGE_SIZE = 10;

const fetchClients = async (page: number, filters: Filters): Promise<{ data: ClientData[]; nextPage: number | null }> => {
  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    .order('created_at', { ascending: false });

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters.funnel_id) {
    query = query.eq('funnel_id', filters.funnel_id);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }

  const totalClients = count || 0;
  const totalPages = Math.ceil(totalClients / PAGE_SIZE);
  const nextPage = page < totalPages - 1 ? page + 1 : null;

  return { data: data || [], nextPage };
};

interface UseClientsProps {
  filters: Filters;
  isEnabled?: boolean;
}

export const useClients = ({ filters, isEnabled = true }: UseClientsProps) => {
  return useInfiniteQuery({
    queryKey: ['clients', filters],
    queryFn: ({ pageParam = 0 }) => fetchClients(pageParam as number, filters),
    getNextPageParam: (lastPage: any) => lastPage?.nextPage,
    initialPageParam: 0, // Add this required property
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
