
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useWhatsAppInstanceState, useWhatsAppInstanceActions, WhatsAppInstance } from "./whatsappInstanceStore";
import { useWhatsAppFetcher } from "./useWhatsAppFetcher";
import { useWhatsAppConnector } from "./useWhatsAppConnector";
import { useWhatsAppDisconnector } from "./useWhatsAppDisconnector";
import { evolutionApiService } from "@/services/evolution-api";
import { useWhatsAppCreator } from "./useWhatsAppCreator";
import { useCompanyResolver } from "./useCompanyResolver";

/**
 * Main hook for managing WhatsApp instances
 */
export const useWhatsAppInstances = (userEmail: string | null) => {
  const [lastError, setLastError] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  
  // Get company ID from user email
  const { companyId } = useCompanyResolver(userEmail || "");
  
  // Pull in specialized hooks for different aspects of WhatsApp management
  const { instances, isLoading, setInstances } = useWhatsAppInstanceState();
  const { setLoading, setError, updateInstance } = useWhatsAppInstanceActions();
  const { fetchInstances, fetchUserInstances } = useWhatsAppFetcher();
  const { connectInstance, refreshQrCode, checkConnectionStatus } = useWhatsAppConnector();
  const { deleteInstance: disconnectInstance } = useWhatsAppDisconnector();
  const { addNewInstance: createInstance } = useWhatsAppCreator(companyId);
  
  // Load instances on component mount
  useEffect(() => {
    if (companyId) {
      loadInstances();
    }
  }, [companyId]);
  
  // Load instances from database
  const loadInstances = async () => {
    try {
      setError(null);
      
      if (!companyId) {
        console.log("No company ID available, skipping instance fetch");
        return;
      }
      
      console.log(`Loading WhatsApp instances for company: ${companyId}`);
      const fetchedInstances = await fetchInstances(companyId);
      
      console.log(`Loaded ${fetchedInstances.length} WhatsApp instances`);
      setInstances(fetchedInstances);
    } catch (error) {
      console.error("Error loading WhatsApp instances:", error);
      setError(error instanceof Error ? error.message : "Error loading instances");
    }
  };
  
  // Handle connection for an instance
  const handleConnectInstance = async (instanceId: string) => {
    try {
      setError(null);
      setLoading(instanceId, true);
      
      const instance = instances.find(instance => instance.id === instanceId);
      if (!instance) {
        throw new Error("WhatsApp instance not found");
      }
      
      await connectInstance(instance);
      toast.success("WhatsApp conectado com sucesso!");
    } catch (error) {
      console.error("Error connecting WhatsApp:", error);
      setError(error instanceof Error ? error.message : "Error connecting WhatsApp");
      toast.error("Erro ao conectar WhatsApp");
    } finally {
      setLoading(instanceId, false);
    }
  };
  
  // Add new instance
  const addNewInstance = async (username: string) => {
    try {
      setError(null);
      
      if (!username) {
        throw new Error("Username is required");
      }
      
      if (!companyId) {
        throw new Error("No company associated with this user");
      }
      
      console.log(`Adding new WhatsApp instance for ${username} in company ${companyId}`);
      
      // Create and connect instance
      const result = await createInstance(username);
      
      // Refresh instances list
      await loadInstances();
      
      return result;
    } catch (error) {
      console.error("Error adding new WhatsApp instance:", error);
      setError(error instanceof Error ? error.message : "Error adding new instance");
      toast.error("Erro ao adicionar nova instância de WhatsApp");
      throw error;
    }
  };
  
  // Check instance status
  const checkInstanceStatus = useCallback(async (instanceId: string) => {
    try {
      const instance = instances.find(inst => inst.id === instanceId);
      if (!instance) {
        console.log(`Instance not found for ID: ${instanceId}`);
        return false;
      }
      
      console.log(`Checking status of ${instance.instanceName} (${instanceId})`);
      const status = await evolutionApiService.checkInstanceStatus(instance.instanceName);
      console.log(`Status of ${instance.instanceName}: ${status}`);
      
      // Update instance status in local state
      updateInstance(instanceId, { 
        connected: status === "connected"
      });
      
      return status === "connected";
    } catch (error) {
      console.error(`Error checking status for instance ${instanceId}:`, error);
      return false;
    }
  }, [instances, updateInstance]);
  
  return {
    instances,
    isLoading,
    lastError,
    loadInstances,
    connectInstance: handleConnectInstance,
    deleteInstance: disconnectInstance,
    refreshQrCode,
    showQrCode,
    setShowQrCode,
    checkInstanceStatus,
    addNewInstance,
  };
};
