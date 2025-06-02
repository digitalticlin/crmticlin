import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";
import { extractUsernameFromEmail, generateSequentialInstanceName } from "@/utils/instanceNaming";

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

  // Get current user email for username extraction
  const getCurrentUserEmail = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        return user.email;
      }
      throw new Error('User email not found');
    } catch (error) {
      console.error('Error getting user email:', error);
      return 'user';
    }
  }, []);

  // Generate instance name based on username and existing instances
  const generateInstanceName = useCallback(async () => {
    try {
      const userEmail = await getCurrentUserEmail();
      const username = extractUsernameFromEmail(userEmail);
      
      // Get existing instance names for the company
      const existingNames = instances.map(instance => instance.instance_name.toLowerCase());
      
      return generateSequentialInstanceName(username, existingNames);
    } catch (error) {
      console.error('Error generating instance name:', error);
      return `user${instances.length + 1}`;
    }
  }, [getCurrentUserEmail, instances]);

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
      console.log('✅ Instâncias carregadas:', mappedInstances.length);
    } catch (err: any) {
      console.error('Error fetching WhatsApp Web instances:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, companyLoading]);

  // Create instance with simplified flow
  const createInstance = async (customInstanceName?: string): Promise<void> => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    try {
      await getAuthenticatedSession();
      
      const instanceName = customInstanceName || await generateInstanceName();
      
      console.log('🔧 Criando instância com nome:', instanceName);
      
      // Check for duplicate names before attempting creation
      const existingInstance = instances.find(
        instance => instance.instance_name.toLowerCase() === instanceName.toLowerCase()
      );
      
      if (existingInstance) {
        toast.error(`Instância com nome "${instanceName}" já existe. Gerando nome alternativo...`);
        const alternativeName = await generateInstanceName();
        console.log('Using alternative name:', alternativeName);
        return createInstance(alternativeName);
      }
      
      const result = await WhatsAppWebService.createInstance(instanceName);

      if (result.success && result.instance) {
        await fetchInstances();
        
        const newInstance = result.instance;
        setAutoConnectState({
          isConnecting: false,
          showQRModal: true,
          activeInstanceId: newInstance.id
        });
        
        toast.success('✅ Instância criada! Gerando QR Code...');
        
        // Tentar obter QR code imediatamente
        setTimeout(() => {
          refreshQRCode(newInstance.id);
        }, 2000);
        
      } else {
        throw new Error(result.error || 'Falha ao criar instância');
      }
    } catch (error: any) {
      console.error('Error creating instance:', error);
      
      let errorMessage = 'Erro ao criar instância';
      
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Instância com este nome já existe. Tente com outro nome.';
      } else if (error.message.includes('VPS não está respondendo')) {
        errorMessage = 'Servidor WhatsApp offline. Tente novamente em alguns minutos.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Erro de configuração do servidor. Contate o suporte.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout na conexão. Tente novamente.';
      } else {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Auto connection flow with simplified handling
  const startAutoConnection = async () => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    setAutoConnectState(prev => ({ ...prev, isConnecting: true }));

    try {
      const instanceName = await generateInstanceName();
      console.log('🚀 Auto-conectando com nome da instância:', instanceName);
      
      const result = await WhatsAppWebService.createInstance(instanceName);

      if (result.success && result.instance) {
        const newInstance = result.instance;
        
        await fetchInstances();
        
        setAutoConnectState({
          isConnecting: false,
          showQRModal: true,
          activeInstanceId: newInstance.id
        });
        
        toast.success('✅ Instância criada! Gerando QR Code...');
        
        // Tentar obter QR code imediatamente
        setTimeout(() => {
          refreshQRCode(newInstance.id);
        }, 2000);
        
      } else {
        throw new Error(result.error || 'Falha ao criar instância');
      }
    } catch (error: any) {
      console.error('Error in auto connection:', error);
      setAutoConnectState(prev => ({ ...prev, isConnecting: false }));
      
      let errorMessage = 'Erro ao conectar WhatsApp';
      
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Conflito de nomes. Tente novamente.';
      } else if (error.message.includes('VPS não está respondendo')) {
        errorMessage = 'Servidor WhatsApp offline. Tente mais tarde.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Erro de configuração. Contate o suporte.';
      } else {
        errorMessage = `Erro: ${error.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  // Delete instance with complete VPS cleanup
  const deleteInstance = async (instanceId: string) => {
    try {
      await getAuthenticatedSession();
      
      const result = await WhatsAppWebService.deleteInstance(instanceId);
      
      if (result.success) {
        await fetchInstances();
        toast.success('✅ Instância deletada com sucesso');
      } else {
        throw new Error(result.error || 'Falha ao deletar instância');
      }
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      toast.error(`❌ Erro ao deletar instância: ${error.message}`);
    }
  };

  // Simplified QR Code refresh
  const refreshQRCode = async (instanceId: string): Promise<string | null> => {
    try {
      await getAuthenticatedSession();
      
      console.log('🔄 Solicitando QR code para instância:', instanceId);
      
      const result = await WhatsAppWebService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        // Atualizar no banco
        await supabase
          .from('whatsapp_instances')
          .update({ 
            qr_code: result.qrCode,
            web_status: 'waiting_scan'
          })
          .eq('id', instanceId);
        
        await fetchInstances();
        toast.success('✅ QR Code gerado com sucesso!');
        return result.qrCode;
      } else {
        throw new Error(result.error || 'Falha ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      toast.error(`❌ Erro ao gerar QR Code: ${error.message}`);
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
