
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

  // FASE 1: Usar dados do usuário autenticado
  useEffect(() => {
    if (user) {
      setUserEmail(user.email || "");
      console.log('[WhatsAppWebSection] 👤 FASE 1 - Usuário carregado:', user.email);
    }
  }, [user]);

  // Cleanup polling ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // FASE 1: Fluxo corrigido de criação com modal automático
  const handleConnect = async () => {
    console.log('[WhatsAppWebSection] 🚀 FASE 1 - Connect requested');
    
    const instanceName = await generateIntelligentInstanceName(userEmail);
    console.log('[WhatsAppWebSection] 🎯 FASE 1 - Nome gerado:', instanceName);
    
    try {
      console.log('[WhatsAppWebSection] 📱 FASE 1 - Criando instância...');
      
      // FASE 1: ABRIR MODAL IMEDIATAMENTE para melhor UX
      setLocalSelectedInstanceName(instanceName);
      setLocalShowQRModal(true);
      setIsWaitingForQR(true);
      
      const createdInstance = await createInstance(instanceName);
      
      if (createdInstance) {
        console.log('[WhatsAppWebSection] ✅ FASE 1 - Instância criada:', createdInstance);
        
        if (createdInstance.qr_code) {
          // QR Code disponível imediatamente
          console.log('[WhatsAppWebSection] ✅ FASE 1 - QR Code imediato disponível!');
          setLocalSelectedQRCode(createdInstance.qr_code);
          setIsWaitingForQR(false);
          toast.success(`QR Code pronto! Escaneie para conectar.`);
        } else {
          // QR Code não disponível - iniciar polling
          console.log('[WhatsAppWebSection] ⏳ FASE 1 - Iniciando polling para QR Code...');
          toast.info(`Instância "${instanceName}" criada! Preparando QR Code...`);
          
          await startPolling(
            createdInstance.id,
            createdInstance.instance_name,
            (qrCode: string) => {
              console.log('[WhatsAppWebSection] 🎉 FASE 1 - QR Code recebido via polling!');
              setLocalSelectedQRCode(qrCode);
              setIsWaitingForQR(false);
              toast.success('QR Code pronto! Escaneie para conectar.');
            }
          );
        }
      }
    } catch (error) {
      console.error('[WhatsAppWebSection] ❌ FASE 1 - Erro na criação:', error);
      setIsWaitingForQR(false);
      setLocalShowQRModal(false);
      stopPolling();
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] 🗑️ FASE 1 - Deleting instance:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] 🔄 FASE 1 - Refreshing QR code for instance:', instanceId);
    const result = await refreshQRCode(instanceId);
    
    if (result && result.success && result.qrCode) {
      const instance = instances.find(i => i.id === instanceId);
      setLocalSelectedQRCode(result.qrCode);
      setLocalSelectedInstanceName(instance?.instance_name || '');
      setLocalShowQRModal(true);
      setIsWaitingForQR(false);
    }
  };

  const handleShowQR = (instance: any) => {
    if (instance.qr_code) {
      setLocalSelectedQRCode(instance.qr_code);
      setLocalSelectedInstanceName(instance.instance_name);
      setLocalShowQRModal(true);
      setIsWaitingForQR(false);
    }
  };

  const closeQRModal = () => {
    console.log('[WhatsAppWebSection] 🔐 FASE 1 - Fechando modal');
    setLocalShowQRModal(false);
    setLocalSelectedQRCode(null);
    setLocalSelectedInstanceName('');
    setIsWaitingForQR(false);
    stopPolling();
  };

  const isConnectingOrPolling = isConnecting || isPolling;

  return {
    instances,
    isLoading,
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
