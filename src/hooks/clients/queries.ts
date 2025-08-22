
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  document: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  notes: string;
  purchase_value: number;
  createdAt: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
    country: string;
  };
}

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform leads to ClientData format
      return (data || []).map(lead => ({
        id: lead.id,
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        document: lead.document_id || '',
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        created_by_user_id: lead.created_by_user_id,
        notes: lead.notes || '',
        purchase_value: 0,
        createdAt: lead.created_at,
        address: {
          street: lead.address || '',
          city: lead.city || '',
          state: lead.state || '',
          zipcode: lead.zip_code || '',
          country: lead.country || 'Brasil'
        }
      })) as ClientData[];
    }
  });
};

export const useClientsQuery = useClients;

export const useDefaultWhatsAppInstance = () => {
  return useQuery({
    queryKey: ['default-whatsapp-instance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_status', 'connected')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });
};

export const useFilterOptions = () => {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => ({
      tags: [],
      users: [],
      stages: []
    })
  });
};
