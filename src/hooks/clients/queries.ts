
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientData } from './types';

export function useClientsQuery(userId: string | null, searchQuery: string = '') {
  return useQuery({
    queryKey: ['clients', userId, searchQuery],
    queryFn: async (): Promise<ClientData[]> => {
      if (!userId) return [];

      let query = supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          company,
          address,
          document_id,
          notes,
          purchase_value,
          created_at,
          updated_at
        `)
        .eq('created_by_user_id', userId);

      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      return data?.map((lead): ClientData => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        company: lead.company || '',
        address: lead.address || '',
        document_id: lead.document_id || '',
        notes: lead.notes || '',
        purchase_value: lead.purchase_value || 0,
        created_at: lead.created_at,
        updated_at: lead.updated_at
      })) || [];
    },
    enabled: !!userId,
  });
}
