
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  connection_type: 'web';
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  connection_status: string;
  qr_code?: string;
  phone?: string;
  profile_name?: string;
  company_id: string;
}

interface AutoConnectState {
  isConnecting: boolean;
  showQRModal: boolean;
  activeInstanceId: string | null;
}

export function useWhatsAppWebInstances(companyId: string | null, companyLoading: boolean = false) {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoConnectState, setAutoConnectState] = useState<AutoConnectState>({
    isConnecting: false,
    showQRModal: false,
    activeInstanceId: null
  });

  // Get authenticated session for API calls
  const getAuthenticatedSession = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error('User not authenticated');
    }
    return session;
  }, []);

  // Get admin user name for default instance naming
  const getAdminUserName = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('company_id', companyId)
        .eq('role', 'admin')
        .single();
      
      if (profile?.full_name) {
        return profile.full_name.split(' ')[0]; // First name only
      }
      
      // Fallback: get current user name
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        return user.email.split('@')[0];
      }
      
      return 'Usuario';
    } catch (error) {
      console.error('Error getting admin name:', error);
      return 'Usuario';
    }
  }, [companyId]);

  // Generate default instance name
  const generateInstanceName = useCallback(async () => {
    const adminName = await getAdminUserName();
    const instanceCount = instances.length + 1;
    return `${adminName} WhatsApp ${instanceCount}`;
  }, [getAdminUserName, instances.length]);

  // Fetch instances from database
  const fetchInstances = useCallback(async () => {
    if (!companyId || companyLoading) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedInstances: WhatsAppWebInstance[] = (data || []).map(instance => ({
        id: instance.id,
        instance_name: instance.instance_name,
        connection_type: 'web',
        server_url: instance.server_url || '',
        vps_instance_id: instance.vps_instance_id || '',
        web_status: instance.web_status || 'creating',
        connection_status: instance.connection_status || 'disconnected',
        qr_code: instance.qr_code,
        phone: instance.phone,
        profile_name: instance.profile_name,
        company_id: instance.company_id
      }));

      setInstances(mappedInstances);
    } catch (err: any) {
      console.error('Error fetching WhatsApp Web instances:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, companyLoading]);

  // Create instance with authentication and improved naming
  const createInstance = async (customInstanceName?: string): Promise<void> => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    try {
      // Get authenticated session
      await getAuthenticatedSession();
      
      // Use custom name or generate default
      const instanceName = customInstanceName || await generateInstanceName();
      
      const result = await WhatsAppWebService.createInstance(instanceName);

      if (result.success && result.instance) {
        await fetchInstances();
        toast.success('Instância WhatsApp criada com sucesso!');
      } else {
        throw new Error(result.error || 'Falha ao criar instância');
      }
    } catch (error: any) {
      console.error('Error creating instance:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
    }
  };

  // Auto connection flow with improved naming
  const startAutoConnection = async () => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    setAutoConnectState(prev => ({ ...prev, isConnecting: true }));

    try {
      const instanceName = await generateInstanceName();
      
      const result = await WhatsAppWebService.createInstance(instanceName);

      if (result.success && result.instance) {
        const newInstance = result.instance;
        
        setAutoConnectState({
          isConnecting: false,
          showQRModal: true,
          activeInstanceId: newInstance.id
        });

        // Refresh instances to include the new one
        await fetchInstances();
        
        toast.success('Instância WhatsApp criada! Escaneie o QR Code para conectar.');
      } else {
        throw new Error(result.error || 'Falha ao criar instância');
      }
    } catch (error: any) {
      console.error('Error in auto connection:', error);
      setAutoConnectState(prev => ({ ...prev, isConnecting: false }));
      toast.error(`Erro ao conectar WhatsApp: ${error.message}`);
    }
  };

  // Delete instance with complete VPS cleanup
  const deleteInstance = async (instanceId: string) => {
    try {
      // Get authenticated session
      await getAuthenticatedSession();
      
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (result.success) {
        await fetchInstances();
        toast.success('Instância deletada com sucesso da VPS e banco de dados');
      } else {
        throw new Error(result.error || 'Falha ao deletar instância');
      }
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
    }
  };

  // Refresh QR Code - improved logic
  const refreshQRCode = async (instanceId: string): Promise<string | null> => {
    try {
      // Get authenticated session
      await getAuthenticatedSession();
      
      const result = await WhatsAppWebService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        await fetchInstances();
        toast.success('QR Code gerado com sucesso');
        return result.qrCode;
      } else {
        throw new Error(result.error || 'Falha ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
      return null;
    }
  };

  // Modal controls
  const closeQRModal = () => {
    setAutoConnectState(prev => ({
      ...prev,
      showQRModal: false,
      activeInstanceId: null
    }));
  };

  const openQRModal = (instanceId: string) => {
    setAutoConnectState(prev => ({
      ...prev,
      showQRModal: true,
      activeInstanceId: instanceId
    }));
  };

  // Fetch instances on mount and company change
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Refetch function for external use
  const refetch = () => {
    fetchInstances();
  };

  return {
    instances,
    loading,
    error,
    autoConnectState,
    createInstance,
    fetchInstances,
    deleteInstance,
    refreshQRCode,
    startAutoConnection,
    closeQRModal,
    openQRModal,
    refetch
  };
}
