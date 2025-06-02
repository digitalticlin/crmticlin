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
      
      // Use custom name or generate default based on username
      const instanceName = customInstanceName || await generateInstanceName();
      
      console.log('Creating instance with name:', instanceName);
      
      const result = await WhatsAppWebService.createInstance(instanceName);

      if (result.success && result.instance) {
        // Refresh instances to get the latest data including QR code
        await fetchInstances();
        
        // Check if QR code is available and show modal automatically
        const newInstance = result.instance;
        if (newInstance.qr_code) {
          setAutoConnectState({
            isConnecting: false,
            showQRModal: true,
            activeInstanceId: newInstance.id
          });
          toast.success('Instância criada! QR Code pronto para escaneamento.');
        } else {
          toast.success('Instância criada! Gerando QR Code...');
          // Try to get QR code if not immediately available
          setTimeout(async () => {
            const qrCode = await refreshQRCode(newInstance.id);
            if (qrCode) {
              setAutoConnectState({
                isConnecting: false,
                showQRModal: true,
                activeInstanceId: newInstance.id
              });
            }
          }, 2000);
        }
      } else {
        throw new Error(result.error || 'Falha ao criar instância');
      }
    } catch (error: any) {
      console.error('Error creating instance:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
    }
  };

  // Auto connection flow with improved naming and QR handling
  const startAutoConnection = async () => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    setAutoConnectState(prev => ({ ...prev, isConnecting: true }));

    try {
      const instanceName = await generateInstanceName();
      console.log('Auto-connecting with instance name:', instanceName);
      
      const result = await WhatsAppWebService.createInstance(instanceName);

      if (result.success && result.instance) {
        const newInstance = result.instance;
        
        // Refresh instances to include the new one
        await fetchInstances();
        
        // Check if QR code is available
        if (newInstance.qr_code) {
          setAutoConnectState({
            isConnecting: false,
            showQRModal: true,
            activeInstanceId: newInstance.id
          });
          toast.success('Instância criada! Escaneie o QR Code para conectar.');
        } else {
          // QR code not immediately available, try to generate
          console.log('QR Code not immediately available, attempting to generate...');
          try {
            const qrCode = await refreshQRCode(newInstance.id);
            if (qrCode) {
              setAutoConnectState({
                isConnecting: false,
                showQRModal: true,
                activeInstanceId: newInstance.id
              });
              toast.success('QR Code gerado! Escaneie para conectar.');
            } else {
              setAutoConnectState({
                isConnecting: false,
                showQRModal: false,
                activeInstanceId: null
              });
              toast.warning('Instância criada. Clique em "Gerar QR Code" para conectar.');
            }
          } catch (qrError) {
            console.error('Error generating QR code:', qrError);
            setAutoConnectState({
              isConnecting: false,
              showQRModal: false,
              activeInstanceId: null
            });
            toast.warning('Instância criada. Clique em "Gerar QR Code" para conectar.');
          }
        }
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

  // Refresh QR Code - improved logic with proper database update
  const refreshQRCode = async (instanceId: string): Promise<string | null> => {
    try {
      // Get authenticated session
      await getAuthenticatedSession();
      
      console.log('Requesting QR code for instance:', instanceId);
      const result = await WhatsAppWebService.getQRCode(instanceId);
      
      if (result.success && result.qrCode) {
        // Update instance in database with new QR code
        const { error: updateError } = await supabase
          .from('whatsapp_instances')
          .update({ 
            qr_code: result.qrCode,
            web_status: 'waiting_scan'
          })
          .eq('id', instanceId);

        if (updateError) {
          console.error('Error updating QR code in database:', updateError);
        } else {
          console.log('QR code successfully updated in database');
        }

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
