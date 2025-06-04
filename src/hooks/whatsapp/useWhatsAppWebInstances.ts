
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { useInstanceActions } from './services/instanceActionsService';
import { toast } from 'sonner';

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  phone: string;
  company_id: string;
  connection_status: string;
  web_status: string;
  qr_code: string | null;
  vps_instance_id: string;
  server_url: string;
  created_at: string;
  updated_at: string;
  profile_name?: string;
  profile_pic_url?: string;
}

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<WhatsAppWebInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');

  // Fetch instances from database
  const fetchInstances = useCallback(async () => {
    console.log('[Hook] 📊 Fetching WhatsApp Web instances...');
    setIsLoading(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      // Get user company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error('User company not found');
      }

      // Fetch instances for user's company
      const { data: instancesData, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Hook] ❌ Error fetching instances:', error);
        throw error;
      }

      console.log(`[Hook] ✅ Found ${instancesData?.length || 0} instances`);
      setInstances(instancesData || []);

    } catch (error: any) {
      console.error('[Hook] 💥 Error in fetchInstances:', error);
      toast.error(`Erro ao buscar instâncias: ${error.message}`);
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create instance with QR modal
  const createInstance = useCallback(async (instanceName: string) => {
    console.log('[Hook] 🆕 Creating WhatsApp Web instance:', instanceName);
    setIsConnecting(true);
    
    try {
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (result.success && result.instance) {
        console.log('[Hook] ✅ Instance created successfully:', result.instance);
        
        // Show QR Modal immediately if QR code is available
        if (result.instance.qr_code) {
          console.log('[Hook] 📱 Opening QR Modal...');
          setSelectedQRCode(result.instance.qr_code);
          setSelectedInstanceName(result.instance.instance_name);
          setShowQRModal(true);
          
          toast.success(`Instância "${instanceName}" criada! Escaneie o QR Code.`);
        } else {
          toast.warning(`Instância "${instanceName}" criada, mas QR Code não disponível.`);
        }
        
        // Refresh instances list
        await fetchInstances();
        return result.instance;
      } else {
        throw new Error(result.error || 'Failed to create instance');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ Create instance error:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [fetchInstances]);

  // Get instance actions
  const { deleteInstance, refreshQRCode } = useInstanceActions(fetchInstances);

  // Close QR Modal
  const closeQRModal = useCallback(() => {
    console.log('[Hook] 🔐 Closing QR Modal');
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
  }, []);

  // Auto-fetch instances on mount
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  // Setup real-time updates
  useEffect(() => {
    console.log('[Hook] 🔄 Setting up real-time updates...');
    
    const channel = supabase
      .channel('whatsapp-instances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances'
        },
        (payload) => {
          console.log('[Hook] 📡 Real-time update:', payload);
          fetchInstances(); // Refresh on any change
        }
      )
      .subscribe();

    return () => {
      console.log('[Hook] 🔄 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [fetchInstances]);

  return {
    instances,
    isLoading,
    loading: isLoading, // Alias for compatibility
    isConnecting,
    error: null, // Add error state for compatibility
    createInstance,
    deleteInstance,
    refreshQRCode,
    refetch: fetchInstances, // Add refetch alias
    
    // QR Modal state
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    closeQRModal
  };
};
