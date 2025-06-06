
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWhatsAppWebInstances } from "./useWhatsAppWebInstances";
import { useAuth } from "@/contexts/AuthContext";

export const useWhatsAppWebSectionLogic = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [localShowQRModal, setLocalShowQRModal] = useState(false);
  const [localSelectedQRCode, setLocalSelectedQRCode] = useState<string | null>(null);
  const [localSelectedInstanceName, setLocalSelectedInstanceName] = useState<string>('');
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [creationStage, setCreationStage] = useState<string>('');

  const { user } = useAuth();

  const {
    instances,
    isLoading,
    createInstance,
    deleteInstance,
    generateQRCode,
    generateIntelligentInstanceName
  } = useWhatsAppWebInstances();

  // Usar dados do usuário autenticado
  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
    }
  }, [user]);

  // NOVO FLUXO: Apenas criar instância sem abrir modal
  const handleConnect = async () => {
    try {
      setIsCreatingInstance(true);
      setCreationStage('Criando instância...');
      
      const instanceName = await generateIntelligentInstanceName(userEmail);
      
      toast.loading(`Criando instância "${instanceName}"...`, { id: 'creating-instance' });
      
      const createdInstance = await createInstance(instanceName);
      
      if (!createdInstance) {
        throw new Error('Falha ao criar instância');
      }
      
      toast.success(`Instância "${instanceName}" criada com sucesso!`, { id: 'creating-instance' });
      
    } catch (error: any) {
      toast.error(`Erro ao criar instância: ${error.message}`, { id: 'creating-instance' });
    } finally {
      setIsCreatingInstance(false);
      setCreationStage('');
    }
  };

  // NOVA FUNÇÃO: Gerar QR Code sob demanda
  const handleGenerateQR = async (instanceId: string) => {
    try {
      setIsGeneratingQR(true);
      
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error('Instância não encontrada');
      }

      toast.loading('Gerando QR Code...', { id: 'generating-qr' });
      
      const result = await generateQRCode(instanceId);
      
      if (result && result.success && result.qrCode) {
        setLocalSelectedQRCode(result.qrCode);
        setLocalSelectedInstanceName(instance.instance_name);
        setLocalShowQRModal(true);
        toast.success('QR Code gerado com sucesso!', { id: 'generating-qr' });
      } else {
        throw new Error(result?.error || 'Falha ao gerar QR Code');
      }
    } catch (error: any) {
      toast.error(`Erro ao gerar QR Code: ${error.message}`, { id: 'generating-qr' });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    await deleteInstance(instanceId);
  };

  const handleShowQR = (instance: any) => {
    if (instance.qr_code) {
      setLocalSelectedQRCode(instance.qr_code);
      setLocalSelectedInstanceName(instance.instance_name);
      setLocalShowQRModal(true);
    } else {
      toast.error('QR Code não disponível para esta instância');
    }
  };

  const closeQRModal = () => {
    setLocalShowQRModal(false);
    setLocalSelectedQRCode(null);
    setLocalSelectedInstanceName('');
  };

  const isConnectingOrPolling = isCreatingInstance || isGeneratingQR;

  return {
    instances,
    isLoading,
    isCreatingInstance,
    creationStage,
    isConnectingOrPolling,
    localShowQRModal,
    localSelectedQRCode,
    localSelectedInstanceName,
    isWaitingForQR: false, // Removido polling
    currentAttempt: 0,
    maxAttempts: 0,
    handleConnect,
    handleDeleteInstance,
    handleGenerateQR, // Nova função
    handleRefreshQR: handleGenerateQR, // Alias para compatibilidade
    handleShowQR,
    closeQRModal
  };
};
