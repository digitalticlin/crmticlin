
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
      
      // Transform leads to ClientData format matching the types.ts interface
      return (data || []).map(lead => ({
        id: lead.id,
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || undefined,
        address: lead.address || undefined, // Keep as string to match interface
        bairro: lead.bairro || undefined,
        city: lead.city || undefined,
        state: lead.state || undefined,
        country: lead.country || undefined,
        zip_code: lead.zip_code || undefined,
        company: lead.company || undefined,
        notes: lead.notes || undefined,
        purchase_value: lead.purchase_value || 0,
        document_type: lead.document_type as 'cpf' | 'cnpj' | undefined,
        document_id: lead.document_id || undefined,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        created_by_user_id: lead.created_by_user_id,
        contacts: [],
        tags: [],
        createdAt: lead.created_at // Add required createdAt property
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
      stages: [],
      funnelStages: [],
      responsibleUsers: []
    })
  });
};
