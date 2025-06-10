
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HybridInstanceService } from "@/services/whatsapp/hybridInstanceService";

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

      console.log('[Hook] ✅ CORREÇÃO: Instâncias carregadas via Supabase:', data?.length || 0);
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
      } else if (timeElapsed === 35) {
        setCreationProgress(prev => prev ? {
          ...prev,
          phase: 'EDGE_FUNCTION_WAITING',
          message: 'Aguardando resposta da Edge Function... (35s)'
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

  // CORREÇÃO: Criar instância APENAS via Edge Function
  const createInstance = async (): Promise<CreateInstanceResult> => {
    setIsConnecting(true);
    
    try {
      console.log('[Hook] 🚀 CORREÇÃO: Iniciando criação VIA EDGE FUNCTION APENAS');
      
      // Iniciar timer de progresso para Edge Function
      const timer = startProgressTimer('Chamando Edge Function whatsapp_instance_manager...');
      
      // Atualizar progresso
      setCreationProgress({
        phase: 'EDGE_FUNCTION_CALL',
        message: 'Enviando requisição para Edge Function...',
        timeElapsed: 0
      });

      const result = await HybridInstanceService.createInstance() as CreateInstanceResult;
      
      // Parar timer
      stopProgressTimer();

      if (result.success && result.instance) {
        console.log('[Hook] ✅ CORREÇÃO: Sucesso via Edge Function!');
        
        // Mostrar informações sobre nome inteligente
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
        
        console.log('[Hook] 📋 CORREÇÃO: Modal NÃO será aberto automaticamente');

        return result;
      }

      throw new Error(result.error || 'Falha desconhecida na Edge Function');

    } catch (error: any) {
      stopProgressTimer();
      console.error('[Hook] ❌ CORREÇÃO: Erro na Edge Function:', error);
      
      // Mensagens de erro específicas para Edge Function
      let errorMessage = error.message;
      let errorDescription = '';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Erro de conexão com Edge Function';
        errorDescription = 'Verifique sua conexão com a internet';
      } else if (error.message.includes('500')) {
        errorMessage = 'Erro interno da Edge Function';
        errorDescription = 'Tente novamente em alguns segundos';
      } else if (error.message.includes('Email do usuário é obrigatório')) {
        errorMessage = 'Erro na geração do nome da instância';
        errorDescription = 'Email do usuário não encontrado';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        id: 'creating-instance-edge-function-error'
      });
      
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      console.log('[Hook] 🗑️ CORREÇÃO: Deletando via Edge Function:', instanceId);
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
      console.log('[Hook] 🔄 CORREÇÃO: Refresh QR via Edge Function whatsapp_qr_service:', instanceId);
      
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
