
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

  // FASE 3.0: Usar dados do usuário autenticado
  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
      console.log('[WhatsAppWebSection] 👤 FASE 3.0 - Usuário carregado:', user.email);
    }
  }, [user]);

  // Cleanup polling ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // FASE 3.0: Fluxo CORRIGIDO de criação - MODAL APÓS CRIAÇÃO BEM-SUCEDIDA
  const handleConnect = async () => {
    console.log('[WhatsAppWebSection] 🚀 FASE 3.0 - Connect requested');
    
    try {
      // CORREÇÃO CRÍTICA 1: Primeiro, mostrar estado de criação
      setIsCreatingInstance(true);
      
      // CORREÇÃO CRÍTICA 2: Gerar nome da instância
      const instanceName = await generateIntelligentInstanceName(userEmail);
      console.log('[WhatsAppWebSection] 🎯 FASE 3.0 - Nome gerado:', instanceName);
      
      // CORREÇÃO CRÍTICA 3: Primeiro criar a instância, SEM abrir modal ainda
      console.log('[WhatsAppWebSection] 📱 FASE 3.0 - Criando instância...');
      toast.loading(`Criando instância "${instanceName}"...`);
      
      const createdInstance = await createInstance(instanceName);
      
      if (!createdInstance) {
        throw new Error('Falha ao criar instância');
      }
      
      console.log('[WhatsAppWebSection] ✅ FASE 3.0 - Instância criada com sucesso:', {
        id: createdInstance.id,
        name: createdInstance.instance_name,
        hasQrCode: !!createdInstance.qr_code
      });
      
      // CORREÇÃO CRÍTICA 4: Somente AGORA configurar e abrir o modal
      setLocalSelectedInstanceName(createdInstance.instance_name);
      
      // CORREÇÃO CRÍTICA 5: Configurar o estado correto antes de abrir o modal
      if (createdInstance.qr_code) {
        // QR Code disponível imediatamente
        console.log('[WhatsAppWebSection] ✅ FASE 3.0 - QR Code imediato disponível!');
        setLocalSelectedQRCode(createdInstance.qr_code);
        setIsWaitingForQR(false);
        toast.success(`QR Code pronto! Escaneie para conectar.`, {id: "qr-ready"});
      } else {
        // QR Code não disponível - preparar para polling
        console.log('[WhatsAppWebSection] ⏳ FASE 3.0 - Preparando polling para QR Code...');
        setIsWaitingForQR(true);
        toast.info(`Preparando QR Code para "${instanceName}"...`, {id: "qr-waiting"});
      }
      
      // CORREÇÃO CRÍTICA 6: Agora sim, abrir o modal depois de configurado
      setLocalShowQRModal(true);
      
      // CORREÇÃO CRÍTICA 7: Se não tiver QR Code, iniciar polling
      if (!createdInstance.qr_code) {
        console.log('[WhatsAppWebSection] 🔄 FASE 3.0 - Iniciando polling para QR Code...');
        
        await startPolling(
          createdInstance.id,
          createdInstance.instance_name,
          (qrCode: string) => {
            console.log('[WhatsAppWebSection] 🎉 FASE 3.0 - QR Code recebido via polling!');
            setLocalSelectedQRCode(qrCode);
            setIsWaitingForQR(false);
            toast.success('QR Code pronto! Escaneie para conectar.', {id: "qr-ready"});
          }
        );
      }
    } catch (error: any) {
      console.error('[WhatsAppWebSection] ❌ FASE 3.0 - Erro na criação:', error);
      setIsWaitingForQR(false);
      setLocalShowQRModal(false);
      stopPolling();
      toast.error(`Erro ao criar instância: ${error.message}`);
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] 🗑️ FASE 3.0 - Deleting instance:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] 🔄 FASE 3.0 - Refreshing QR code for instance:', instanceId);
    
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
    console.log('[WhatsAppWebSection] 🔐 FASE 3.0 - Fechando modal');
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
