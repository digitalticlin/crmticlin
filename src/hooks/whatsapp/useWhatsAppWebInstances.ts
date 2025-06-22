
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQRCodeManagement } from "@/modules/whatsapp/qrCodeManagement/hooks/useQRCodeManagement";
import { InstanceApi } from "@/modules/whatsapp/instanceCreation/api/instanceApi";

interface CreateInstanceResult {
  success: boolean;
  instance?: any;
  error?: string;
  operationId?: string;
  intelligent_name?: string;
  fallback_used?: boolean;
  mode?: string;
}

export const useWhatsAppWebInstances = () => {
  const { user } = useAuth();
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPollingActive, setQrPollingActive] = useState(false);

  // Integrar com módulo QR Code Management
  const { openQRModal, closeQRModal, requestQRCode, getQRState } = useQRCodeManagement();

  const loadInstances = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('[Hook] ⚠️ Usuário não autenticado');
        setInstances([]);
        return;
      }

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('created_by_user_id', user.id)
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Hook] ❌ Erro ao carregar instâncias:', error);
        toast.error('Erro ao carregar instâncias');
        return;
      }

      console.log('[Hook] ✅ Instâncias carregadas:', data?.length || 0);
      setInstances(data || []);
    } catch (error: any) {
      console.error('[Hook] ❌ Erro geral:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const createInstance = async (): Promise<CreateInstanceResult> => {
    try {
      console.log('[Hook] 🚀 Criando instância via InstanceApi modular');
      
      if (!user?.email) {
        throw new Error('Email do usuário não disponível');
      }

      const result = await InstanceApi.createInstance({
        userEmail: user.email,
        instanceName: user.email.split('@')[0]
      });

      if (result.success) {
        console.log('[Hook] ✅ Instância criada:', result);
        toast.success('Instância criada com sucesso!');
        
        // Recarregar lista
        await loadInstances();
        
        // CORREÇÃO: Abrir modal QR automaticamente após criação
        if (result.instance?.id) {
          console.log('[Hook] 📱 Abrindo modal QR automaticamente:', result.instance.id);
          setTimeout(() => {
            refreshQRCode(result.instance.id);
          }, 1000);
        }
      } else {
        console.error('[Hook] ❌ Falha na criação:', result.error);
        toast.error(`Erro ao criar instância: ${result.error}`);
      }

      return result;

    } catch (error: any) {
      console.error('[Hook] ❌ Erro ao criar instância:', error);
      const errorResult = {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
      toast.error(`Erro: ${error.message}`);
      return errorResult;
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      console.log('[Hook] 🗑️ Deletando instância via Edge Function:', instanceId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_delete', {
        body: { instanceId }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        toast.success('Instância deletada com sucesso!');
        await loadInstances();
      } else {
        throw new Error(data?.error || 'Erro ao deletar instância');
      }

    } catch (error: any) {
      console.error('[Hook] ❌ Erro ao deletar:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
    }
  };

  const refreshQRCode = async (instanceId: string) => {
    try {
      console.log('[Hook] 🔄 Refresh QR via QRCodeApi:', instanceId);
      
      // Encontrar a instância para pegar o nome
      const instance = instances.find(i => i.id === instanceId);
      const instanceName = instance?.instance_name || 'Instância';
      
      // Abrir modal e iniciar processo
      setSelectedQRCode(null);
      setSelectedInstanceName(instanceName);
      setShowQRModal(true);
      setQrPollingActive(true);
      
      // Solicitar QR Code via Edge Function
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_manager', {
        body: { instanceId }
      });

      if (error) {
        console.error('[Hook] ❌ Erro na Edge Function:', error);
        setQrPollingActive(false);
        return {
          success: false,
          waiting: false,
          error: error.message
        };
      }

      if (data?.success && data.qrCode) {
        console.log('[Hook] ✅ QR Code recebido:', instanceId);
        setSelectedQRCode(data.qrCode);
        setQrPollingActive(false);
        return {
          success: true,
          waiting: false,
          qrCode: data.qrCode,
          message: 'QR Code obtido com sucesso'
        };
      } else if (data?.connected) {
        console.log('[Hook] ✅ Instância já conectada:', instanceId);
        setQrPollingActive(false);
        setShowQRModal(false);
        toast.success('WhatsApp já está conectado!');
        await loadInstances();
        return {
          success: true,
          waiting: false,
          message: 'Instância já conectada'
        };
      } else {
        console.log('[Hook] ⏳ Aguardando QR Code:', instanceId);
        return {
          success: false,
          waiting: true,
          message: 'Aguardando QR Code'
        };
      }

    } catch (error: any) {
      console.error('[Hook] ❌ Erro geral:', error);
      setQrPollingActive(false);
      return {
        success: false,
        waiting: false,
        error: error.message || 'Erro ao buscar QR Code'
      };
    }
  };

  const closeQRModal = () => {
    console.log('[Hook] 🔒 Fechando modal QR');
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName(null);
    setQrPollingActive(false);
  };

  const retryQRCode = async () => {
    if (selectedInstanceName) {
      const instance = instances.find(i => i.instance_name === selectedInstanceName);
      if (instance) {
        await refreshQRCode(instance.id);
      }
    }
  };

  return {
    instances,
    isLoading,
    selectedQRCode,
    selectedInstanceName,
    showQRModal,
    qrPollingActive,
    createInstance,
    deleteInstance,
    refreshQRCode,
    closeQRModal,
    retryQRCode,
    loadInstances
  };
};
