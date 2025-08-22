
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientData } from './types';

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
        document: lead.document || '',
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        notes: lead.notes || '',
        purchase_value: 0,
        address: {
          street: '',
          city: '',
          state: '',
          zipcode: '',
          country: 'Brasil'
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
