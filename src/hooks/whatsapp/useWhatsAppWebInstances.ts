import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HybridInstanceService } from "@/services/whatsapp/hybridInstanceService";

interface CreateInstanceResult {
  success: boolean;
  instance?: any;
  error?: string;
  operationId?: string;
  vps_health?: {
    latency: number;
    healthy: boolean;
  };
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

      console.log('[Hook] ✅ FASE 2: Instâncias carregadas:', data?.length || 0);
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
      phase: 'STARTING_DIRECT',
      message: initialMessage,
      timeElapsed: 0
    });

    const timer = setInterval(() => {
      timeElapsed += 1;
      setCreationProgress(prev => prev ? {
        ...prev,
        timeElapsed
      } : null);

      // Mensagens baseadas no tempo decorrido para criação direta
      if (timeElapsed === 15) {
        setCreationProgress(prev => prev ? {
          ...prev,
          phase: 'DIRECT_VPS_COMMUNICATION',
          message: 'Comunicação direta com VPS... (15s)'
        } : null);
      } else if (timeElapsed === 30) {
        setCreationProgress(prev => prev ? {
          ...prev,
          phase: 'DIRECT_RETRY_LOGIC',
          message: 'Primeira tentativa demorou, tentando novamente... (30s)'
        } : null);
      } else if (timeElapsed === 45) {
        setCreationProgress(prev => prev ? {
          ...prev,
          phase: 'DIRECT_WARNING',
          message: 'Criação direta está demorando... Aguarde mais um pouco (45s)'
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

  // FASE 2: Criar instância com sistema direto (sem instanceName)
  const createInstance = async (): Promise<CreateInstanceResult> => {
    setIsConnecting(true);
    
    try {
      console.log('[Hook] 🚀 FASE 2: Iniciando criação DIRETA (sem health check)');
      
      // Iniciar timer de progresso para criação direta
      const timer = startProgressTimer('Iniciando criação direta da instância...');
      
      // Atualizar progresso
      setCreationProgress({
        phase: 'DIRECT_CREATION',
        message: 'Gerando nome inteligente baseado no email...',
        timeElapsed: 0
      });

      const result = await HybridInstanceService.createInstance() as CreateInstanceResult;
      
      // Parar timer
      stopProgressTimer();

      if (result.success && result.instance) {
        console.log('[Hook] ✅ FASE 2: Sucesso com criação direta!');
        
        // Mostrar informações sobre nome inteligente
        if (result.intelligent_name) {
          toast.success(`Instância criada com sucesso!`, {
            description: `Nome inteligente: ${result.intelligent_name} (criação direta)`
          });
        } else {
          toast.success('Instância criada com sucesso!', {
            description: `Criação direta sem health check concluída`
          });
        }

        await loadInstances(); // Recarregar lista
        
        // UX CORRIGIDA: NÃO abrir modal automaticamente
        console.log('[Hook] 📋 UX: Modal NÃO será aberto automaticamente (FASE 2)');

        return result;
      }

      throw new Error(result.error || 'Falha desconhecida na criação direta');

    } catch (error: any) {
      stopProgressTimer();
      console.error('[Hook] ❌ FASE 2: Erro na criação direta:', error);
      
      // Mensagens de erro específicas para criação direta
      let errorMessage = error.message;
      let errorDescription = '';
      
      if (error.message.includes('Timeout')) {
        errorMessage = 'Timeout na criação direta';
        errorDescription = 'A comunicação com o servidor VPS falhou';
      } else if (error.message.includes('HTTP')) {
        errorMessage = 'Erro de comunicação com servidor VPS';
        errorDescription = 'Verifique sua conexão e tente novamente';
      } else if (error.message.includes('Email do usuário é obrigatório')) {
        errorMessage = 'Erro na geração do nome da instância';
        errorDescription = 'Email do usuário não encontrado';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        id: 'creating-instance-direct-error'
      });
      
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
