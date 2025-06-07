
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWhatsAppWebInstances } from "./useWhatsAppWebInstances";
import { useAutomaticQRPolling } from "./useAutomaticQRPolling";
import { useAuth } from "@/contexts/AuthContext";

export const useWhatsAppWebSectionLogic = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [localShowQRModal, setLocalShowQRModal] = useState(false);
  const [localSelectedQRCode, setLocalSelectedQRCode] = useState<string | null>(null);
  const [localSelectedInstanceName, setLocalSelectedInstanceName] = useState<string>('');
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [creationStage, setCreationStage] = useState<string>('');

  const { user } = useAuth();

  const {
    instances,
    isLoading,
    isConnecting,
    createInstance,
    deleteInstance,
    refreshQRCode,
    generateIntelligentInstanceName
  } = useWhatsAppWebInstances();

  const { isPolling, currentAttempt, maxAttempts, startPolling, stopPolling } = useAutomaticQRPolling();

  // Usar dados do usuário autenticado
  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
    }
  }, [user]);

  // Cleanup polling ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Fluxo SINCRONIZADO - VPS-Frontend
  const handleConnect = async () => {
    try {
      // ETAPA 1: Preparar criação
      setIsCreatingInstance(true);
      setCreationStage('Iniciando conexão...');
      
      // ETAPA 2: Gerar nome da instância
      const generatedInstanceName = await generateIntelligentInstanceName(userEmail);
      
      setCreationStage('Preparando WhatsApp...');
      toast.loading(`Criando instância "${generatedInstanceName}"...`, { id: 'creating-instance' });
      
      // ETAPA 3: AGUARDAR confirmação COMPLETA da VPS
      const createdInstance = await createInstance(generatedInstanceName);
      
      if (!createdInstance || !createdInstance.success) {
        throw new Error('Falha ao criar instância');
      }
      
      // ETAPA 4: Aguardar para garantir sincronização VPS-DB
      setCreationStage('Quase pronto...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ETAPA 5: Configurar modal APENAS após confirmação completa
      const instanceData = createdInstance.data || createdInstance.instance;
      const finalInstanceName = instanceData?.instance_name || generatedInstanceName;
      setLocalSelectedInstanceName(finalInstanceName);
      
      const qrCode = instanceData?.qr_code;
      if (qrCode) {
        // QR Code disponível - VPS processou completamente
        setLocalSelectedQRCode(qrCode);
        setIsWaitingForQR(false);
        setCreationStage('Pronto para escanear!');
        toast.success(`QR Code pronto! Escaneie para conectar.`, { id: 'creating-instance' });
      } else {
        // QR Code não disponível - iniciar polling
        setIsWaitingForQR(true);
        setCreationStage('Preparando QR Code...');
        toast.info(`Preparando QR Code para "${finalInstanceName}"...`, { id: 'creating-instance' });
        
        // Polling com confirmação de instância existente
        const instanceId = instanceData?.id;
        if (instanceId) {
          await startPolling(
            instanceId,
            finalInstanceName,
            (qrCode: string) => {
              setLocalSelectedQRCode(qrCode);
              setIsWaitingForQR(false);
              setCreationStage('Pronto para escanear!');
              toast.success('QR Code pronto! Escaneie para conectar.', { id: 'creating-instance' });
            }
          );
        }
      }
      
      // ETAPA 6: AGORA SIM abrir modal após tudo estar pronto
      setLocalShowQRModal(true);
      
    } catch (error: any) {
      setIsWaitingForQR(false);
      setLocalShowQRModal(false);
      setCreationStage('');
      stopPolling();
      toast.error(`Erro ao criar instância: ${error.message}`, { id: 'creating-instance' });
    } finally {
      setIsCreatingInstance(false);
      setCreationStage('');
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    try {
      setIsWaitingForQR(true);
      const result = await refreshQRCode(instanceId);
      
      if (result && result.success && result.qrCode) {
        const instance = instances.find(i => i.id === instanceId);
        setLocalSelectedQRCode(result.qrCode);
        setLocalSelectedInstanceName(instance?.instance_name || '');
        setLocalShowQRModal(true);
        setIsWaitingForQR(false);
      } else {
        setIsWaitingForQR(false);
        throw new Error('QR Code não disponível');
      }
    } catch (error: any) {
      setIsWaitingForQR(false);
      toast.error(`Erro ao atualizar QR Code: ${error.message}`);
    }
  };

  const handleShowQR = (instance: any) => {
    if (instance.qr_code) {
      setLocalSelectedQRCode(instance.qr_code);
      setLocalSelectedInstanceName(instance.instance_name);
      setLocalShowQRModal(true);
      setIsWaitingForQR(false);
    } else {
      toast.error('QR Code não disponível para esta instância');
    }
  };

  const closeQRModal = () => {
    setLocalShowQRModal(false);
    setLocalSelectedQRCode(null);
    setLocalSelectedInstanceName('');
    setIsWaitingForQR(false);
    stopPolling();
  };

  const isConnectingOrPolling = isConnecting || isPolling || isCreatingInstance;

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
    currentAttempt,
    maxAttempts,
    handleConnect,
    handleDeleteInstance,
    handleRefreshQR,
    handleShowQR,
    closeQRModal
  };
};
