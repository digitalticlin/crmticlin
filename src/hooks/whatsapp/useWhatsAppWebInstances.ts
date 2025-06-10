
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HybridInstanceService } from "@/services/whatsapp/hybridInstanceService";

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');

  // CARREGAR INSTÂNCIAS DO USUÁRIO ATUAL
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
        .eq('created_by_user_id', user.id) // FILTRO POR USUÁRIO
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Hook] ❌ Erro ao carregar instâncias:', error);
        toast.error('Erro ao carregar instâncias');
        return;
      }

      console.log('[Hook] ✅ HÍBRIDO: Instâncias carregadas:', data?.length || 0);
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

  // CRIAR INSTÂNCIA COM MÉTODO HÍBRIDO
  const createInstance = async (instanceName: string) => {
    setIsConnecting(true);
    
    try {
      console.log('[Hook] 🚀 HÍBRIDO: Criando instância:', instanceName);
      
      const result = await HybridInstanceService.createInstance(instanceName);
      
      if (result.success && result.instance) {
        console.log(`[Hook] ✅ HÍBRIDO: Sucesso via ${result.method.toUpperCase()}!`);
        
        toast.success(`Instância criada via ${result.method === 'edge_function' ? 'Edge Function' : 'VPS Direto'}!`, {
          description: `${instanceName} está sendo inicializada...`
        });

        await loadInstances(); // Recarregar lista
        
        // Verificar se tem QR Code disponível
        if (result.instance.qr_code) {
          setSelectedQRCode(result.instance.qr_code);
          setSelectedInstanceName(instanceName);
          setShowQRModal(true);
        }

        return result;
      }

      throw new Error(result.error || 'Falha desconhecida na criação');

    } catch (error: any) {
      console.error('[Hook] ❌ HÍBRIDO: Erro na criação:', error);
      toast.error(`Erro na criação: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      const result = await HybridInstanceService.deleteInstance(instanceId);
      
      if (result.success) {
        toast.success('Instância deletada com sucesso!');
        await loadInstances();
      } else {
        throw new Error(result.error || 'Erro ao deletar');
      }
    } catch (error: any) {
      console.error('[Hook] ❌ Erro ao deletar:', error);
      toast.error(`Erro ao deletar: ${error.message}`);
    }
  };

  const refreshQRCode = async (instanceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_service', {
        body: {
          action: 'get_qr_code_v3',
          instanceId: instanceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao buscar QR Code');
      }

      if (data?.success && data.qrCode) {
        return {
          success: true,
          qrCode: data.qrCode
        };
      }

      return {
        success: false,
        waiting: data?.waiting || false,
        error: data?.error || 'QR Code não disponível'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro ao buscar QR Code'
      };
    }
  };

  const generateIntelligentInstanceName = async (userEmail: string): Promise<string> => {
    const emailPrefix = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now().toString().slice(-6);
    return `${emailPrefix}_${timestamp}`;
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
  };

  const retryQRCode = async () => {
    // Implementação de retry se necessário
    console.log('[Hook] 🔄 Retry QR Code...');
  };

  return {
    instances,
    isLoading,
    isConnecting,
    showQRModal,
    selectedQRCode,
    selectedInstanceName,
    createInstance,
    deleteInstance,
    refreshQRCode,
    generateIntelligentInstanceName,
    closeQRModal,
    retryQRCode,
    loadInstances
  };
};
