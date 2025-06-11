
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ApiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string>('');
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null);
  
  // Estados para UX melhorada
  const [qrPollingActive, setQrPollingActive] = useState(false);

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

  // ETAPA 1: Gerar nome inteligente baseado no usuário (aceita email opcional)
  const generateIntelligentInstanceName = async (emailOverride?: string): Promise<string> => {
    try {
      const userEmail = emailOverride || user?.email;
      
      if (!userEmail) {
        console.log('[Hook] ⚠️ Email não disponível, usando fallback');
        return `whatsapp_${Date.now()}`;
      }

      // Extrair username do email (digitalticlin@gmail.com → digitalticlin)
      const username = userEmail.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      console.log('[Hook] 📧 Username extraído:', username);

      // Buscar instâncias existentes do usuário para determinar próximo número
      const { data: existingInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('instance_name')
        .eq('created_by_user_id', user?.id)
        .eq('connection_type', 'web');

      if (error) {
        console.error('[Hook] ❌ Erro ao buscar instâncias existentes:', error);
        return `${username}_${Date.now()}`;
      }

      const existingNames = existingInstances?.map(i => i.instance_name) || [];
      console.log('[Hook] 📋 Nomes existentes:', existingNames);

      // Verificar se o nome base está disponível
      if (!existingNames.includes(username)) {
        console.log('[Hook] ✅ Nome base disponível:', username);
        return username;
      }

      // Encontrar próximo número disponível
      let counter = 1;
      let candidateName = `${username}${counter}`;
      
      while (existingNames.includes(candidateName)) {
        counter++;
        candidateName = `${username}${counter}`;
      }

      console.log('[Hook] ✅ Nome inteligente gerado:', candidateName);
      return candidateName;

    } catch (error) {
      console.error('[Hook] ❌ Erro na geração de nome inteligente:', error);
      const fallbackName = `whatsapp_${Date.now()}`;
      console.log('[Hook] 🔄 Usando nome fallback:', fallbackName);
      return fallbackName;
    }
  };

  // ETAPA 2 & 3: Polling automático para QR Code
  const startQRPolling = async (instanceId: string, instanceName: string) => {
    console.log('[Hook] 🔄 Iniciando polling para QR Code:', instanceId);
    setQrPollingActive(true);
    
    const maxAttempts = 15; // 45 segundos (3s * 15)
    let attempts = 0;

    const pollQRCode = async () => {
      if (attempts >= maxAttempts) {
        console.log('[Hook] ⏰ Timeout no polling do QR Code');
        setQrPollingActive(false);
        toast.error('Timeout: QR Code não foi gerado em tempo hábil');
        return;
      }

      attempts++;
      console.log(`[Hook] 🔍 Polling QR Code - Tentativa ${attempts}/${maxAttempts}`);

      try {
        const result = await ApiClient.getQRCode(instanceId);
        
        if (result.success && result.data?.qrCode) {
          console.log('[Hook] ✅ QR Code obtido via polling!');
          setSelectedQRCode(result.data.qrCode);
          setQrPollingActive(false);
          toast.success('QR Code gerado! Escaneie para conectar.');
          return;
        }

        if (result.data?.waiting) {
          console.log('[Hook] ⏳ QR Code ainda sendo gerado...');
          // Continuar polling
          setTimeout(pollQRCode, 3000);
        } else {
          console.log('[Hook] ❌ Erro no polling:', result.error);
          setQrPollingActive(false);
          toast.error(`Erro ao obter QR Code: ${result.error}`);
        }
      } catch (error: any) {
        console.error('[Hook] ❌ Erro no polling:', error);
        setQrPollingActive(false);
        toast.error(`Erro no polling: ${error.message}`);
      }
    };

    // Aguardar 2 segundos antes do primeiro polling (dar tempo para VPS processar)
    setTimeout(pollQRCode, 2000);
  };

  // IMPLEMENTAÇÃO PRINCIPAL: Criar instância com UX fluida
  const createInstance = async (): Promise<CreateInstanceResult> => {
    setIsConnecting(true);
    
    try {
      console.log('[Hook] 🚀 INICIANDO CRIAÇÃO COM UX FLUIDA');
      
      // ETAPA 1: Verificar autenticação
      const authCheck = await ApiClient.checkAuth();
      if (!authCheck.authenticated) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      console.log('[Hook] ✅ Usuário autenticado:', authCheck.user?.email);
      
      // ETAPA 2: Gerar nome inteligente
      const intelligentName = await generateIntelligentInstanceName();
      console.log('[Hook] 🎯 Nome inteligente:', intelligentName);
      
      // ETAPA 3: Abrir modal IMEDIATAMENTE
      setSelectedInstanceName(intelligentName);
      setSelectedQRCode(null);
      setShowQRModal(true);
      
      console.log('[Hook] 📱 Modal aberto - Chamando Edge Function...');
      
      // ETAPA 4: Chamar Edge Function com nome inteligente
      const result = await ApiClient.createInstance(authCheck.user?.email) as CreateInstanceResult;
      
      if (result.success && result.instance) {
        console.log('[Hook] ✅ Instância criada:', result.instance);
        
        const instanceId = result.instance.id;
        setCurrentInstanceId(instanceId);
        
        // ETAPA 5: Iniciar polling automático para QR Code
        await startQRPolling(instanceId, intelligentName);
        
        // Recarregar lista
        await loadInstances();
        
        return result;
      }

      throw new Error(result.error || 'Falha desconhecida na Edge Function');

    } catch (error: any) {
      console.error('[Hook] ❌ Erro na criação:', error);
      
      // Fechar modal em caso de erro
      setShowQRModal(false);
      
      toast.error(`Erro ao criar instância: ${error.message}`);
      
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      console.log('[Hook] 🗑️ Deletando via ApiClient:', instanceId);
      
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
      console.log('[Hook] 🔄 Refresh QR via ApiClient:', instanceId);
      
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

  const closeQRModal = () => {
    console.log('[Hook] ❌ Fechando modal QR');
    setShowQRModal(false);
    setSelectedQRCode(null);
    setSelectedInstanceName('');
    setCurrentInstanceId(null);
    setQrPollingActive(false);
  };

  const retryQRCode = async () => {
    if (currentInstanceId && selectedInstanceName) {
      console.log('[Hook] 🔄 Tentando novamente QR Code para:', currentInstanceId);
      setSelectedQRCode(null);
      await startQRPolling(currentInstanceId, selectedInstanceName);
    }
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
    closeQRModal,
    retryQRCode,
    loadInstances,
    generateIntelligentInstanceName, // CORRIGIDO: Função agora aceita email opcional
    // Estados adicionais para UX
    qrPollingActive,
    currentInstanceId
  };
};
