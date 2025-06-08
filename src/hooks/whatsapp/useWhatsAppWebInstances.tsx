import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QRCodeResult {
  qrCode: string;
}

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar instâncias:', error);
        setError(error.message);
      } else {
        setInstances(data || []);
      }
    } catch (error: any) {
      console.error('Erro inesperado ao buscar instâncias:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInstance = async (instanceName: string) => {
    try {
      console.log('[useWhatsAppWebInstances] 🚀 CREATEINSTANCE CHAMADO');
      console.log('[useWhatsAppWebInstances] 📊 Parâmetros:', { instanceName });
      console.log('[useWhatsAppWebInstances] 🔧 Validando nome...');
      
      if (!instanceName || instanceName.trim().length < 3) {
        throw new Error('Nome da instância deve ter pelo menos 3 caracteres');
      }

      const normalizedName = instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      console.log('[useWhatsAppWebInstances] ✅ Nome normalizado:', normalizedName);

      setIsConnecting(true);
      setError(null);

      console.log('[useWhatsAppWebInstances] 📡 CHAMANDO EDGE FUNCTION: whatsapp_instance_manager');
      console.log('[useWhatsAppWebInstances] 📦 Payload:', {
        action: 'create_instance',
        instanceName: normalizedName
      });

      const { data, error: invokeError } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'create_instance',
          instanceName: normalizedName
        }
      });

      console.log('[useWhatsAppWebInstances] 📥 RESPOSTA DA EDGE FUNCTION:');
      console.log('[useWhatsAppWebInstances] - Error:', invokeError);
      console.log('[useWhatsAppWebInstances] - Data:', data);

      if (invokeError) {
        console.error('[useWhatsAppWebInstances] ❌ ERRO NA INVOCAÇÃO:', invokeError);
        throw new Error(`Erro na chamada da função: ${invokeError.message}`);
      }

      if (!data) {
        console.error('[useWhatsAppWebInstances] ❌ DATA É NULL/UNDEFINED');
        throw new Error('Resposta vazia da função');
      }

      if (!data.success) {
        console.error('[useWhatsAppWebInstances] ❌ SUCCESS = FALSE:', data.error);
        throw new Error(data.error || 'Erro desconhecido na criação da instância');
      }

      console.log('[useWhatsAppWebInstances] ✅ INSTÂNCIA CRIADA COM SUCESSO:', data.instance);
      
      // Atualizar lista de instâncias
      await refetch();
      
      toast.success(`Instância "${normalizedName}" criada com sucesso!`);
      
      return data;

    } catch (error: any) {
      console.error('[useWhatsAppWebInstances] 💥 ERRO FINAL:', error);
      console.error('[useWhatsAppWebInstances] 📋 Stack trace:', error.stack);
      
      setError(error.message);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'delete_instance',
          instanceId: instanceId
        }
      });

      if (error) {
        console.error('Erro ao deletar instância:', error);
        setError(error.message);
        toast.error(`Erro ao deletar instância: ${error.message}`);
      } else {
        toast.success('Instância deletada com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro inesperado ao deletar instância:', error);
      setError(error.message);
      toast.error(`Erro ao deletar instância: ${error.message}`);
    } finally {
      setIsLoading(false);
      await refetch();
    }
  };

  const refreshQRCode = async (instanceId: string): Promise<QRCodeResult | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: {
          action: 'get_qr_code',
          instanceId: instanceId
        }
      });

      if (error) {
        console.error('Erro ao obter QR Code:', error);
        toast.error(`Erro ao obter QR Code: ${error.message}`);
        return null;
      }

      if (!data?.success) {
        console.error('Falha ao obter QR Code:', data?.error);
        toast.error(`Falha ao obter QR Code: ${data?.error || 'Erro desconhecido'}`);
        return null;
      }

      if (data?.qrCode) {
        return { qrCode: data.qrCode };
      } else {
        toast.warning('QR Code não disponível ainda.');
        return null;
      }
    } catch (error: any) {
      console.error('Erro inesperado ao obter QR Code:', error);
      toast.error(`Erro ao obter QR Code: ${error.message}`);
      return null;
    }
  };

  const generateIntelligentInstanceName = async (userEmail: string): Promise<string> => {
    const timestamp = Date.now();
    const baseName = userEmail.split('@')[0];
    return `whatsapp_${baseName}_${timestamp}`;
  };

  const showQRCodeModal = (qrCode: string, instanceName: string) => {
    setSelectedQRCode(qrCode);
    setSelectedInstanceName(instanceName);
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
  };

  useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    instances,
    isLoading,
    isConnecting,
    error,
    createInstance,
    deleteInstance,
    refetch,
    refreshQRCode,
    generateIntelligentInstanceName,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    showQRCodeModal,
    closeQRModal
  };
};
