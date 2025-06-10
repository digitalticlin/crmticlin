
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWhatsAppWebInstances } from "./useWhatsAppWebInstances";
import { useInstanceActionsV3 } from "./services/instanceActionsV3Service";
import { useAuth } from "@/contexts/AuthContext";

export const useWhatsAppWebV3Logic = () => {
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
    loadInstances,
    generateIntelligentInstanceName
  } = useWhatsAppWebInstances();

  // Wrapper para refreshInstances
  const refreshInstances = async (): Promise<void> => {
    await loadInstances();
  };

  const {
    createInstanceV3,
    getQRCodeV3
  } = useInstanceActionsV3(refreshInstances);

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

  // CORREÇÃO: Polling com timeout de 90s e intervalo de 3s
  function startQRPollingV3(instanceId: string, instanceName: string, maxAttempts = 30) {
    console.log('[WhatsApp V3] 🔄 Iniciando polling QR Code V3 - PROCESSO CORRETO:', { instanceId, maxAttempts });
    
    let attempts = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`[WhatsApp V3] 📱 Polling tentativa ${attempts}/${maxAttempts} para: ${instanceName}`);
      
      try {
        const result = await getQRCodeV3(instanceId);
        
        if (result.success && result.qrCode) {
          // QR Code encontrado!
          console.log('[WhatsApp V3] ✅ QR Code encontrado via polling V3 - PROCESSO CORRETO');
          setLocalSelectedQRCode(result.qrCode);
          setIsWaitingForQR(false);
          setCreationStage('Pronto para escanear!');
          toast.success('QR Code pronto com processo correto! Escaneie para conectar.');
          clearInterval(pollInterval);
          setQrPollingInterval(null);
        } else if (attempts >= maxAttempts) {
          // Timeout do polling - 90s
          console.log('[WhatsApp V3] ⏰ Timeout do polling QR Code V3 (90s)');
          setIsWaitingForQR(false);
          setCreationStage('');
          toast.error('Timeout ao aguardar QR Code (90s). Tente gerar novamente.');
          clearInterval(pollInterval);
          setQrPollingInterval(null);
        }
        
      } catch (error) {
        console.error('[WhatsApp V3] ❌ Erro no polling:', error);
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

  // Fluxo completo V3 - seguindo processo correto especificado
  const handleConnectV3 = async () => {
    try {
      setIsCreatingInstance(true);
      setCreationStage('Iniciando conexão V3 - Processo Correto...');
      
      // Gerar nome da instância
      const instanceName = await generateIntelligentInstanceName(userEmail);
      
      setCreationStage('Criando instância WhatsApp V3 com processo correto...');
      toast.loading(`Criando instância "${instanceName}" com processo correto...`, { id: 'creating-instance-v3' });
      
      // Criar instância usando V3 (processo correto)
      const createdInstance = await createInstanceV3(instanceName);
      
      if (!createdInstance) {
        throw new Error('Falha ao criar instância V3');
      }
      
      console.log('[WhatsApp V3] ✅ Instância V3 criada com processo correto:', createdInstance);
      
      setCreationStage('Aguardando QR Code...');
      setLocalSelectedInstanceName(createdInstance.instance_name);
      
      // Aguardar para garantir que a VPS está pronta
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setCreationStage('Preparando QR Code com processo correto...');
      toast.info(`Preparando QR Code para "${instanceName}" com processo correto...`, { id: 'creating-instance-v3' });
      
      // Tentar buscar QR Code imediatamente
      const qrResult = await getQRCodeV3(createdInstance.id);
      
      if (qrResult.success && qrResult.qrCode) {
        // QR Code já disponível
        setLocalSelectedQRCode(qrResult.qrCode);
        setIsWaitingForQR(false);
        setCreationStage('Pronto para escanear!');
        toast.success('QR Code pronto com processo correto! Escaneie para conectar.', { id: 'creating-instance-v3' });
      } else {
        // Iniciar polling para QR Code (90s timeout)
        setIsWaitingForQR(true);
        setCreationStage('Aguardando QR Code (processo correto - 90s)...');
        toast.info('Aguardando QR Code com processo correto (90s timeout)...', { id: 'creating-instance-v3' });
        
        startQRPollingV3(createdInstance.id, createdInstance.instance_name);
      }
      
      // Abrir modal
      setLocalShowQRModal(true);
      
    } catch (error: any) {
      setIsWaitingForQR(false);
      setLocalShowQRModal(false);
      setCreationStage('');
      toast.error(`Erro ao criar instância V3: ${error.message}`, { id: 'creating-instance-v3' });
    } finally {
      setIsCreatingInstance(false);
      setCreationStage('');
    }
  };

  const handleRefreshQRV3 = async (instanceId: string) => {
    try {
      setIsWaitingForQR(true);
      const result = await getQRCodeV3(instanceId);
      
      if (result && result.success && result.qrCode) {
        const instance = instances.find(i => i.id === instanceId);
        setLocalSelectedQRCode(result.qrCode);
        setLocalSelectedInstanceName(instance?.instance_name || '');
        setLocalShowQRModal(true);
        setIsWaitingForQR(false);
        toast.success('QR Code atualizado com processo correto!');
      } else {
        // Iniciar polling se não encontrou QR Code
        const instance = instances.find(i => i.id === instanceId);
        if (instance) {
          setLocalSelectedInstanceName(instance.instance_name);
          setLocalShowQRModal(true);
          startQRPollingV3(instanceId, instance.instance_name);
          toast.info('Buscando QR Code com processo correto...');
        }
      }
    } catch (error: any) {
      setIsWaitingForQR(false);
      toast.error(`Erro ao atualizar QR Code V3: ${error.message}`);
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
    handleConnectV3,
    handleRefreshQRV3,
    closeQRModal
  };
};
