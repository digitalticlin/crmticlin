import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ApiClient } from "@/lib/apiClient";

interface CreateInstanceResult {
  success: boolean;
  instance?: any;
  error?: string;
  operationId?: string;
  intelligent_name?: string;
}

export const useWhatsAppWebInstances = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  
  // Estados de progresso para UX melhorada
  const [creationProgress, setCreationProgress] = useState<{
    phase: string;
    message: string;
    timeElapsed: number;
  } | null>(null);

  // Timer para progresso
  const [progressTimer, setProgressTimer] = useState<NodeJS.Timeout | null>(null);

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

      console.log('[Hook] ✅ CORREÇÃO FINAL: Instâncias carregadas via Supabase:', data?.length || 0);
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

  // Função para iniciar timer de progresso
  const startProgressTimer = (initialMessage: string) => {
    let timeElapsed = 0;
    setCreationProgress({
      phase: 'EDGE_FUNCTION_ONLY',
      message: initialMessage,
      timeElapsed: 0
    });

    const timer = setInterval(() => {
      timeElapsed += 1;
      setCreationProgress(prev => prev ? {
        ...prev,
        timeElapsed
      } : null);

      // Mensagens baseadas no tempo decorrido para Edge Function
      if (timeElapsed === 10) {
        setCreationProgress(prev => prev ? {
          ...prev,
          phase: 'EDGE_FUNCTION_PROCESSING',
          message: 'Edge Function processando... (10s)'
        } : null);
      } else if (timeElapsed === 20) {
        setCreationProgress(prev => prev ? {
          ...prev,
          phase: 'EDGE_FUNCTION_VPS_COMM',
          message: 'Edge Function comunicando com VPS... (20s)'
        } : null);
      }
    }, 1000);

    setProgressTimer(timer);
    return timer;
  };

  // Função para parar timer de progresso
  const stopProgressTimer = () => {
    if (progressTimer) {
      clearInterval(progressTimer);
      setProgressTimer(null);
    }
    setCreationProgress(null);
  };

  // CORREÇÃO FINAL: Criar instância APENAS via ApiClient
  const createInstance = async (): Promise<CreateInstanceResult> => {
    setIsConnecting(true);
    
    try {
      console.log('[Hook] 🚀 CORREÇÃO FINAL: Iniciando criação VIA API CLIENT (Edge Function apenas)');
      
      // Iniciar timer de progresso
      const timer = startProgressTimer('Chamando Edge Function whatsapp_instance_manager via ApiClient...');
      
      setCreationProgress({
        phase: 'API_CLIENT_CALL',
        message: 'Enviando requisição via ApiClient...',
        timeElapsed: 0
      });

      // USAR APENAS API CLIENT - SEM FALLBACKS
      const result = await ApiClient.createInstance('user_email_from_auth') as CreateInstanceResult;
      
      // Parar timer
      stopProgressTimer();

      if (result.success && result.instance) {
        console.log('[Hook] ✅ CORREÇÃO FINAL: Sucesso via ApiClient!');
        
        if (result.intelligent_name) {
          toast.success(`Instância criada com sucesso!`, {
            description: `Nome inteligente: ${result.intelligent_name} (via Edge Function)`
          });
        } else {
          toast.success('Instância criada com sucesso!', {
            description: `Criação via Edge Function concluída`
          });
        }

        await loadInstances(); // Recarregar lista

        return result;
      }

      throw new Error(result.error || 'Falha desconhecida na Edge Function');

    } catch (error: any) {
      stopProgressTimer();
      console.error('[Hook] ❌ CORREÇÃO FINAL: Erro no ApiClient:', error);
      
      // Mensagens de erro específicas
      let errorMessage = error.message;
      let errorDescription = '';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão com Edge Function';
        errorDescription = 'Verifique sua conexão com a internet';
      } else if (error.message.includes('500')) {
        errorMessage = 'Erro interno da Edge Function';
        errorDescription = 'Tente novamente em alguns segundos';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        id: 'creating-instance-api-client-error'
      });
      
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      console.log('[Hook] 🗑️ CORREÇÃO FINAL: Deletando via ApiClient:', instanceId);
      
      // USAR APENAS API CLIENT
      const result = await ApiClient.deleteInstance(instanceId);
      
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
      console.log('[Hook] 🔄 CORREÇÃO FINAL: Refresh QR via ApiClient:', instanceId);
      
      // USAR APENAS API CLIENT
      const result = await ApiClient.refreshQRCode(instanceId);

      if (result.success && result.data?.qrCode) {
        return {
          success: true,
          qrCode: result.data.qrCode
        };
      }

      return {
        success: false,
        waiting: result.data?.waiting || false,
        error: result.error || 'QR Code não disponível'
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
    loadInstances,
    // Estados de progresso para UX
    creationProgress,
    isCreatingWithProgress: creationProgress !== null
  };
};
