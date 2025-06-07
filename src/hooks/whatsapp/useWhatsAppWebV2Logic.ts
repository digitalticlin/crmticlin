
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWhatsAppWebInstances } from "./useWhatsAppWebInstances";
import { useInstanceActionsV2 } from "./services/instanceActionsV2Service";
import { useAuth } from "@/contexts/AuthContext";

export const useWhatsAppWebV2Logic = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [localShowQRModal, setLocalShowQRModal] = useState(false);
  const [localSelectedQRCode, setLocalSelectedQRCode] = useState<string | null>(null);
  const [localSelectedInstanceName, setLocalSelectedInstanceName] = useState<string>('');
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [creationStage, setCreationStage] = useState<string>('');
  const [qrPollingInterval, setQrPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const { user } = useAuth();

  const {
    instances,
    isLoading,
    fetchInstances,
    generateIntelligentInstanceName
  } = useWhatsAppWebInstances();

  const {
    createInstanceV2,
    getQRCodeV2,
    regenerateQRCodeV2,
    configureWebhookV2
  } = useInstanceActionsV2(fetchInstances);

  // Usar dados do usuário autenticado
  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
    }
  }, [user]);

  // Cleanup polling ao desmontar
  useEffect(() => {
    return () => {
      if (qrPollingInterval) {
        clearInterval(qrPollingInterval);
      }
    };
  }, [qrPollingInterval]);

  // Polling para QR Code com timeout
  const startQRPolling = (instanceId: string, instanceName: string, maxAttempts = 10) => {
    console.log('[WhatsApp V2] 🔄 Iniciando polling QR Code V2:', { instanceId, maxAttempts });
    
    let attempts = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`[WhatsApp V2] 📱 Polling tentativa ${attempts}/${maxAttempts} para: ${instanceName}`);
      
      try {
        const result = await getQRCodeV2(instanceId);
        
        if (result.success && result.qrCode) {
          // QR Code encontrado!
          console.log('[WhatsApp V2] ✅ QR Code encontrado via polling V2');
          setLocalSelectedQRCode(result.qrCode);
          setIsWaitingForQR(false);
          setCreationStage('Pronto para escanear!');
          toast.success('QR Code pronto! Escaneie para conectar.');
          clearInterval(pollInterval);
          setQrPollingInterval(null);
        } else if (attempts >= maxAttempts) {
          // Timeout do polling
          console.log('[WhatsApp V2] ⏰ Timeout do polling QR Code V2');
          setIsWaitingForQR(false);
          setCreationStage('');
          toast.error('Timeout ao aguardar QR Code. Tente gerar novamente.');
          clearInterval(pollInterval);
          setQrPollingInterval(null);
        }
        // Continue polling se ainda não encontrou
        
      } catch (error) {
        console.error('[WhatsApp V2] ❌ Erro no polling:', error);
        if (attempts >= maxAttempts) {
          setIsWaitingForQR(false);
          setCreationStage('');
          clearInterval(pollInterval);
          setQrPollingInterval(null);
        }
      }
    }, 3000); // 3 segundos entre tentativas
    
    setQrPollingInterval(pollInterval);
  };

  // Fluxo completo V2 - VPS-Frontend com webhook melhorado
  const handleConnectV2 = async () => {
    try {
      setIsCreatingInstance(true);
      setCreationStage('Iniciando conexão V2...');
      
      // Gerar nome da instância
      const instanceName = await generateIntelligentInstanceName(userEmail);
      
      setCreationStage('Criando instância WhatsApp V2...');
      toast.loading(`Criando instância "${instanceName}" com melhorias...`, { id: 'creating-instance-v2' });
      
      // Criar instância usando V2
      const createdInstance = await createInstanceV2(instanceName);
      
      if (!createdInstance) {
        throw new Error('Falha ao criar instância V2');
      }
      
      console.log('[WhatsApp V2] ✅ Instância V2 criada:', createdInstance);
      
      setCreationStage('Configurando webhook...');
      setLocalSelectedInstanceName(createdInstance.instance_name);
      
      // Aguardar para garantir que a VPS está pronta
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setCreationStage('Preparando QR Code...');
      toast.info(`Preparando QR Code para "${instanceName}"...`, { id: 'creating-instance-v2' });
      
      // Tentar buscar QR Code imediatamente
      const qrResult = await getQRCodeV2(createdInstance.id);
      
      if (qrResult.success && qrResult.qrCode) {
        // QR Code já disponível
        setLocalSelectedQRCode(qrResult.qrCode);
        setIsWaitingForQR(false);
        setCreationStage('Pronto para escanear!');
        toast.success('QR Code pronto! Escaneie para conectar.', { id: 'creating-instance-v2' });
      } else {
        // Iniciar polling para QR Code
        setIsWaitingForQR(true);
        setCreationStage('Aguardando QR Code...');
        toast.info('Aguardando QR Code...', { id: 'creating-instance-v2' });
        
        startQRPolling(createdInstance.id, createdInstance.instance_name);
      }
      
      // Abrir modal
      setLocalShowQRModal(true);
      
    } catch (error: any) {
      setIsWaitingForQR(false);
      setLocalShowQRModal(false);
      setCreationStage('');
      toast.error(`Erro ao criar instância V2: ${error.message}`, { id: 'creating-instance-v2' });
    } finally {
      setIsCreatingInstance(false);
      setCreationStage('');
    }
  };

  const handleRefreshQRV2 = async (instanceId: string) => {
    try {
      setIsWaitingForQR(true);
      const result = await getQRCodeV2(instanceId);
      
      if (result && result.success && result.qrCode) {
        const instance = instances.find(i => i.id === instanceId);
        setLocalSelectedQRCode(result.qrCode);
        setLocalSelectedInstanceName(instance?.instance_name || '');
        setLocalShowQRModal(true);
        setIsWaitingForQR(false);
        toast.success('QR Code atualizado com sucesso!');
      } else {
        // Iniciar polling se não encontrou QR Code
        const instance = instances.find(i => i.id === instanceId);
        if (instance) {
          setLocalSelectedInstanceName(instance.instance_name);
          setLocalShowQRModal(true);
          startQRPolling(instanceId, instance.instance_name);
          toast.info('Buscando QR Code...');
        }
      }
    } catch (error: any) {
      setIsWaitingForQR(false);
      toast.error(`Erro ao atualizar QR Code V2: ${error.message}`);
    }
  };

  const handleRegenerateQRV2 = async (instanceId: string) => {
    try {
      setIsWaitingForQR(true);
      const result = await regenerateQRCodeV2(instanceId);
      
      if (result.success) {
        const instance = instances.find(i => i.id === instanceId);
        if (instance) {
          setLocalSelectedInstanceName(instance.instance_name);
          setLocalShowQRModal(true);
          startQRPolling(instanceId, instance.instance_name);
        }
      } else {
        setIsWaitingForQR(false);
        throw new Error(result.error || 'Falha ao regenerar QR Code');
      }
    } catch (error: any) {
      setIsWaitingForQR(false);
      toast.error(`Erro ao regenerar QR Code V2: ${error.message}`);
    }
  };

  const closeQRModal = () => {
    setLocalShowQRModal(false);
    setLocalSelectedQRCode(null);
    setLocalSelectedInstanceName('');
    setIsWaitingForQR(false);
    
    // Parar polling se estiver ativo
    if (qrPollingInterval) {
      clearInterval(qrPollingInterval);
      setQrPollingInterval(null);
    }
  };

  const isConnectingOrPolling = isCreatingInstance || isWaitingForQR;

  return {
    instances,
    isLoading,
    isCreatingInstance,
    creationStage,
    isConnectingOrPolling,
    localShowQRModal,
    localSelectedQRCode,
    localSelectedInstanceName,
    isWaitingForQR,
    handleConnectV2,
    handleRefreshQRV2,
    handleRegenerateQRV2,
    closeQRModal,
    configureWebhookV2
  };
};
