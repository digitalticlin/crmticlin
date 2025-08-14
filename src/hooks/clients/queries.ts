
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';

export const useClientsQuery = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Contact[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          address,
          company,
          notes,
          purchase_value,
          owner_id,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(lead => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        address: lead.address,
        company: lead.company,
        notes: lead.notes,
        purchaseValue: lead.purchase_value,
        assignedUser: lead.owner_id,
        createdAt: lead.created_at,
        deals: [],
        tags: []
      }));
    },
  });
};
