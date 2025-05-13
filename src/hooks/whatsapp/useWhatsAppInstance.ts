
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
  
  // Load user instances from Supabase
  useEffect(() => {
    if (!userEmail) return;
    fetchUserInstances();
  }, [userEmail, instanceName]);
  
  // Find instance by ID
  const findInstanceById = (instanceId: string) => {
    return instances.find(i => i.id === instanceId);
  };
  
  // Handle connect instance
  const handleConnectInstance = async (instanceId: string) => {
    const instance = findInstanceById(instanceId);
    if (!instance) {
      throw new Error("Instância não encontrada");
    }
    
    const result = await connectInstance(instance);
    setShowQrCode(instanceId);
    return result;
  };
  
  // Handle refresh QR code
  const handleRefreshQrCode = async (instanceId: string) => {
    const instance = findInstanceById(instanceId);
    if (!instance) {
      throw new Error("Instância não encontrada");
    }
    
    const result = await refreshQrCode(instance);
    setShowQrCode(instanceId);
    return result;
  };
  
  // Handle delete instance
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
    refreshQrCode: handleRefreshQrCode
  };
};
