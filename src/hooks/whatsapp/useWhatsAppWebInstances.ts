
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

      console.log('[Hook] ✅ ROBUSTA: Instâncias carregadas:', data?.length || 0);
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
      phase: 'STARTING',
      message: initialMessage,
      timeElapsed: 0
    });

    const timer = setInterval(() => {
      timeElapsed += 1;
      setCreationProgress(prev => prev ? {
        ...prev,
        timeElapsed
      } : null);

      // Mensagens baseadas no tempo decorrido
      if (timeElapsed === 30) {
        setCreationProgress(prev => prev ? {
          ...prev,
          phase: 'VPS_COMMUNICATION',
          message: 'Comunicando com servidor VPS... (30s)'
        } : null);
      } else if (timeElapsed === 60) {
        setCreationProgress(prev => prev ? {
          ...prev,
          phase: 'RETRY_LOGIC',
          message: 'Primeira tentativa demorou, tentando novamente... (60s)'
        } : null);
      } else if (timeElapsed === 75) {
        setCreationProgress(prev => prev ? {
          ...prev,
          phase: 'WARNING',
          message: 'Está demorando mais que o normal... Aguarde mais um pouco (75s)'
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

  // CORREÇÃO: Criar instância com UX melhorada
  const createInstance = async (instanceName: string): Promise<CreateInstanceResult> => {
    setIsConnecting(true);
    
    try {
      console.log('[Hook] 🚀 ROBUSTA: Iniciando criação com UX melhorada:', instanceName);
      
      // Iniciar timer de progresso
      const timer = startProgressTimer('Iniciando criação da instância...');
      
      // Atualizar progresso
      setCreationProgress({
        phase: 'HEALTH_CHECK',
        message: 'Verificando saúde do servidor...',
        timeElapsed: 0
      });

      const result = await HybridInstanceService.createInstance(instanceName) as CreateInstanceResult;
      
      // Parar timer
      stopProgressTimer();

      if (result.success && result.instance) {
        console.log('[Hook] ✅ ROBUSTA: Sucesso com sistema robusto!');
        
        // Mostrar informações de saúde da VPS se disponível
        if (result.vps_health) {
          toast.success(`Instância criada com sucesso! (VPS latência: ${result.vps_health.latency}ms)`, {
            description: `${instanceName} está sendo inicializada via sistema robusto`
          });
        } else {
          toast.success('Instância criada com sucesso!', {
            description: `${instanceName} está sendo inicializada...`
          });
        }

        await loadInstances(); // Recarregar lista
        
        // CORREÇÃO UX: NÃO abrir modal automaticamente
        // O modal será aberto apenas quando o usuário clicar em "Gerar QR Code"
        console.log('[Hook] 📋 UX CORRIGIDA: Modal NÃO será aberto automaticamente');

        return result;
      }

      throw new Error(result.error || 'Falha desconhecida na criação');

    } catch (error: any) {
      stopProgressTimer();
      console.error('[Hook] ❌ ROBUSTA: Erro na criação:', error);
      
      // Mensagens de erro específicas baseadas no tipo
      let errorMessage = error.message;
      let errorDescription = '';
      
      if (error.message.includes('VPS não está saudável')) {
        errorMessage = 'Servidor VPS temporariamente indisponível';
        errorDescription = 'Tente novamente em alguns minutos';
      } else if (error.message.includes('Timeout')) {
        errorMessage = 'Timeout na comunicação com servidor';
        errorDescription = 'O servidor pode estar sobrecarregado';
      } else if (error.message.includes('HTTP')) {
        errorMessage = 'Erro de comunicação com servidor';
        errorDescription = 'Verifique sua conexão e tente novamente';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        id: 'creating-instance-error'
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
