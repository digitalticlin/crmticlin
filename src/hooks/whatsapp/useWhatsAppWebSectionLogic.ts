
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

  // CORREÇÃO CRÍTICA: Usar dados do usuário autenticado
  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
      console.log('[WhatsAppWebSection] 👤 CORREÇÃO CRÍTICA - Usuário carregado:', user.email);
    }
  }, [user]);

  // Cleanup polling ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // CORREÇÃO CRÍTICA: Fluxo SINCRONIZADO - VPS-Frontend
  const handleConnect = async () => {
    console.log('[WhatsAppWebSection] 🚀 CORREÇÃO CRÍTICA - Connect requested - Sequência Sincronizada');
    
    try {
      // ETAPA 1: Preparar criação (sem mostrar nada ainda)
      setIsCreatingInstance(true);
      setCreationStage('Preparando nova instância...');
      
      // ETAPA 2: Gerar nome da instância
      const instanceName = await generateIntelligentInstanceName(userEmail);
      console.log('[WhatsAppWebSection] 🎯 CORREÇÃO CRÍTICA - Nome gerado:', instanceName);
      
      setCreationStage('Criando instância na VPS...');
      toast.loading(`Criando instância "${instanceName}"...`, { id: 'creating-instance' });
      
      // ETAPA 3: AGUARDAR confirmação COMPLETA da VPS
      console.log('[WhatsAppWebSection] 📱 CORREÇÃO CRÍTICA - Criando e AGUARDANDO confirmação VPS...');
      const createdInstance = await createInstance(instanceName);
      
      if (!createdInstance) {
        throw new Error('Falha ao criar instância na VPS');
      }
      
      console.log('[WhatsAppWebSection] ✅ CORREÇÃO CRÍTICA - VPS confirmou criação:', {
        id: createdInstance.id,
        name: createdInstance.instance_name,
        hasQrCode: !!createdInstance.qr_code,
        vpsInstanceId: createdInstance.vps_instance_id
      });
      
      // ETAPA 4: Aguardar 2 segundos para garantir sincronização VPS-DB
      setCreationStage('Sincronizando com banco de dados...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ETAPA 5: Configurar modal APENAS após confirmação completa
      setLocalSelectedInstanceName(createdInstance.instance_name);
      
      if (createdInstance.qr_code) {
        // QR Code disponível - VPS processou completamente
        console.log('[WhatsAppWebSection] ✅ CORREÇÃO CRÍTICA - QR Code confirmado pela VPS!');
        setLocalSelectedQRCode(createdInstance.qr_code);
        setIsWaitingForQR(false);
        setCreationStage('QR Code pronto!');
        toast.success(`QR Code pronto! Escaneie para conectar.`, { id: 'creating-instance' });
      } else {
        // QR Code não disponível - iniciar polling INTELIGENTE
        console.log('[WhatsAppWebSection] ⏳ CORREÇÃO CRÍTICA - QR não disponível, iniciando polling sincronizado...');
        setIsWaitingForQR(true);
        setCreationStage('Preparando QR Code...');
        toast.info(`Preparando QR Code para "${instanceName}"...`, { id: 'creating-instance' });
        
        // Polling com confirmação de instância existente
        await startPolling(
          createdInstance.id,
          createdInstance.instance_name,
          (qrCode: string) => {
            console.log('[WhatsAppWebSection] 🎉 CORREÇÃO CRÍTICA - QR Code obtido via polling sincronizado!');
            setLocalSelectedQRCode(qrCode);
            setIsWaitingForQR(false);
            setCreationStage('QR Code pronto!');
            toast.success('QR Code pronto! Escaneie para conectar.', { id: 'creating-instance' });
          }
        );
      }
      
      // ETAPA 6: AGORA SIM abrir modal após tudo estar pronto
      setLocalShowQRModal(true);
      
    } catch (error: any) {
      console.error('[WhatsAppWebSection] ❌ CORREÇÃO CRÍTICA - Erro na sequência sincronizada:', error);
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
    console.log('[WhatsAppWebSection] 🗑️ CORREÇÃO CRÍTICA - Deleting instance:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] 🔄 CORREÇÃO CRÍTICA - Refreshing QR code for instance:', instanceId);
    
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
    console.log('[WhatsAppWebSection] 🔐 CORREÇÃO CRÍTICA - Fechando modal');
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
