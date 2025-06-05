
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useWhatsAppWebInstances } from "./useWhatsAppWebInstances";
import { useAutomaticQRPolling } from "./useAutomaticQRPolling";
import { supabase } from "@/integrations/supabase/client";

export const useWhatsAppWebSectionLogic = () => {
  const [userEmail, setUserEmail] = useState<string>("");
  const [localShowQRModal, setLocalShowQRModal] = useState(false);
  const [localSelectedQRCode, setLocalSelectedQRCode] = useState<string | null>(null);
  const [localSelectedInstanceName, setLocalSelectedInstanceName] = useState<string>('');
  const [isWaitingForQR, setIsWaitingForQR] = useState(false);

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

  // Load current user data
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error getting user:", error);
          toast.error("Could not load user data");
          return;
        }
        if (user) {
          setUserEmail(user.email || "");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("An error occurred while loading user data");
      }
    };
    getUser();
  }, []);

  // Cleanup polling ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleConnect = async () => {
    console.log('[WhatsAppWebSection] 🚀 Connect requested - OTIMIZADO');
    
    const instanceName = await generateIntelligentInstanceName(userEmail);
    console.log('[WhatsAppWebSection] 🎯 Nome gerado:', instanceName);
    
    try {
      console.log('[WhatsAppWebSection] 📱 Criando instância RÁPIDA...');
      const createdInstance = await createInstance(instanceName);
      
      if (createdInstance) {
        setLocalSelectedInstanceName(createdInstance.instance_name);
        
        // OTIMIZAÇÃO CRÍTICA: Abrir modal IMEDIATAMENTE (mesmo sem QR Code)
        console.log('[WhatsAppWebSection] 🎯 ABRINDO MODAL IMEDIATAMENTE para melhor UX');
        setLocalShowQRModal(true);
        setIsWaitingForQR(true);
        
        if (createdInstance.qr_code) {
          // QR Code disponível imediatamente - preencher modal já aberto
          console.log('[WhatsAppWebSection] ✅ QR Code imediato disponível - preenchendo modal!');
          setLocalSelectedQRCode(createdInstance.qr_code);
          setIsWaitingForQR(false);
          toast.success(`QR Code pronto! Escaneie para conectar.`);
        } else {
          // QR Code não disponível - modal já está aberto, iniciar polling
          console.log('[WhatsAppWebSection] ⏳ Modal aberto - iniciando polling OTIMIZADO...');
          toast.info(`Instância "${instanceName}" criada! Preparando QR Code...`);
          
          await startPolling(
            createdInstance.id,
            createdInstance.instance_name,
            (qrCode: string) => {
              console.log('[WhatsAppWebSection] 🎉 QR Code recebido - preenchendo modal já aberto!');
              setLocalSelectedQRCode(qrCode);
              setIsWaitingForQR(false);
              toast.success('QR Code pronto! Escaneie para conectar.');
            }
          );
        }
      }
    } catch (error) {
      console.error('[WhatsAppWebSection] ❌ Erro na criação:', error);
      setIsWaitingForQR(false);
      setLocalShowQRModal(false); // Fechar modal se deu erro
      stopPolling();
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] Deleting instance:', instanceId);
    await deleteInstance(instanceId);
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('[WhatsAppWebSection] Refreshing QR code for instance:', instanceId);
    const result = await refreshQRCode(instanceId);
    
    if (result.success && result.qrCode) {
      const instance = instances.find(i => i.id === instanceId);
      setLocalSelectedQRCode(result.qrCode);
      setLocalSelectedInstanceName(instance?.instance_name || '');
      setLocalShowQRModal(true);
    }
  };

  const handleShowQR = (instance: any) => {
    if (instance.qr_code) {
      setLocalSelectedQRCode(instance.qr_code);
      setLocalSelectedInstanceName(instance.instance_name);
      setLocalShowQRModal(true);
    }
  };

  const closeQRModal = () => {
    console.log('[WhatsAppWebSection] 🔐 Fechando modal otimizado');
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
