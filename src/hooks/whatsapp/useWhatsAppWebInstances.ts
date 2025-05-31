
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useInstanceCreation } from './useInstanceCreation';
import { useInstanceOperations } from './useInstanceOperations';
import { useWhatsAppRealtime } from './useWhatsAppRealtime';

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  connection_type: string;
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  connection_status: string;
  qr_code?: string;
  phone?: string;
  profile_name?: string;
  profile_pic_url?: string;
  company_id: string;
}

export const useWhatsAppWebInstances = (companyId?: string, companyLoading?: boolean) => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { createInstance: createInstanceBase, isCreating } = useInstanceCreation(companyId);
  const { deleteInstance: deleteInstanceBase, refreshQRCode: refreshQRCodeBase, sendMessage } = useInstanceOperations();

  const fetchInstances = useCallback(async () => {
    if (!companyId) {
      setInstances([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Filtrar apenas instâncias WhatsApp Web.js (sem Evolution)
      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .or('connection_type.eq.web,vps_instance_id.not.is.null')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setInstances(data || []);
    } catch (err) {
      console.error('Error fetching WhatsApp Web instances:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const createInstance = async (instanceName: string): Promise<WhatsAppWebInstance | null> => {
    const newInstance = await createInstanceBase(instanceName);
    
    if (newInstance) {
      // Atualizar a lista local de instâncias
      setInstances(prev => {
        const exists = prev.find(i => i.id === newInstance.id);
        if (exists) {
          return prev.map(i => i.id === newInstance.id ? newInstance : i);
        }
        return [newInstance, ...prev];
      });
    }
    
    return newInstance;
  };

  const deleteInstance = async (instanceId: string) => {
    await deleteInstanceBase(instanceId);
    await fetchInstances();
  };

  const refreshQRCode = async (instanceId: string) => {
    const qrCode = await refreshQRCodeBase(instanceId, instances);
    
    // Update instance in state
    setInstances(prev => prev.map(i => 
      i.id === instanceId 
        ? { ...i, qr_code: qrCode } 
        : i
    ));

    return qrCode;
  };

  // Subscribe to real-time updates
  useWhatsAppRealtime(companyId, fetchInstances);

  // Só buscar instâncias quando companyId estiver disponível e não estiver carregando
  useEffect(() => {
    if (companyLoading) {
      setLoading(true);
      return;
    }
    
    fetchInstances();
  }, [companyId, companyLoading, fetchInstances]);

  return {
    instances,
    loading: loading || isCreating,
    error,
    createInstance,
    deleteInstance,
    refreshQRCode,
    sendMessage,
    refetch: fetchInstances
  };
};
