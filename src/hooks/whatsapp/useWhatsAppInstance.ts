
import { useState, useEffect } from "react";
import { 
  useWhatsAppInstanceState,
  useWhatsAppInstanceActions
} from "./whatsappInstanceStore";
import { useWhatsAppFetcher } from "./useWhatsAppFetcher";
import { useWhatsAppConnector } from "./useWhatsAppConnector";
import { useWhatsAppDisconnector } from "./useWhatsAppDisconnector";

export const useWhatsAppInstances = (userEmail: string) => {
  const { instances, isLoading, lastError } = useWhatsAppInstanceState();
  const { fetchUserInstances, instanceName } = useWhatsAppFetcher(userEmail);
  const { connectInstance, refreshQrCode } = useWhatsAppConnector();
  const { deleteInstance } = useWhatsAppDisconnector();
  
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  
  // Carrega instâncias do usuário do Supabase
  useEffect(() => {
    if (!userEmail) return;
    fetchUserInstances();
  }, [userEmail, instanceName]);
  
  // Encontra instância pelo ID
  const findInstanceById = (instanceId: string) => {
    return instances.find(i => i.id === instanceId);
  };
  
  // Manipula conexão de instância
  const handleConnectInstance = async (instanceId: string) => {
    const instance = findInstanceById(instanceId);
    if (!instance) {
      throw new Error("Instância não encontrada");
    }
    
    const result = await connectInstance(instance);
    setShowQrCode(instanceId);
    return result;
  };
  
  // Manipula atualização de QR code
  const handleRefreshQrCode = async (instanceId: string) => {
    const instance = findInstanceById(instanceId);
    if (!instance) {
      throw new Error("Instância não encontrada");
    }
    
    const result = await refreshQrCode(instance);
    setShowQrCode(instanceId);
    return result;
  };
  
  // Manipula exclusão de instância
  const handleDeleteInstance = async (instanceId: string) => {
    const instance = findInstanceById(instanceId);
    if (!instance) {
      throw new Error("Instância não encontrada");
    }
    
    await deleteInstance(instance);
    setShowQrCode(null);
  };
  
  return {
    instances,
    isLoading,
    instanceName,
    lastError,
    connectInstance: handleConnectInstance,
    deleteInstance: handleDeleteInstance,
    refreshQrCode: handleRefreshQrCode,
    showQrCode
  };
};
