import { useState, useRef } from "react";
import { WhatsAppInstance } from "./whatsappInstanceStore";
import { evolutionApiService } from "@/services/evolution-api";
import { updateInstanceStatusAndPhone, updateQrCodeInDatabase, updateConnectionAttempt } from "./database";

/**
 * Hook for monitoring WhatsApp instance status with throttling and priority checking
 */
export const useWhatsAppStatusMonitor = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const instanceCheckInProgress = useRef<Record<string, boolean>>({});
  const lastCheckTime = useRef<Record<string, number>>({});
  const connectingInstances = useRef<Set<string>>(new Set());
  const lastConnectionError = useRef<Record<string, { timestamp: number, count: number }>>({});
  
  // Função auxiliar para registrar erros e decidir se devemos continuar com verificações frequentes
  const trackConnectionError = (instanceId: string): boolean => {
    const now = Date.now();
    const errorState = lastConnectionError.current[instanceId] || { timestamp: 0, count: 0 };
    
    // Se o último erro foi há mais de 5 minutos, resetamos o contador
    if (now - errorState.timestamp > 5 * 60 * 1000) {
      lastConnectionError.current[instanceId] = { timestamp: now, count: 1 };
      return true; // Continuar verificações
    }
    
    // Incrementar contador de erros
    const newCount = errorState.count + 1;
    lastConnectionError.current[instanceId] = { timestamp: now, count: newCount };
    
    // Se tivemos muitos erros consecutivos em um curto período, reduzimos a frequência
    if (newCount > 5) {
      console.log(`Muitos erros consecutivos para instância ${instanceId}, reduzindo frequência de verificação`);
      return false; // Parar verificações frequentes
    }
    
    return true;
  };
  
  // Limpa os registros de erros de uma instância quando ela conecta com sucesso
  const clearErrorTracking = (instanceId: string) => {
    if (lastConnectionError.current[instanceId]) {
      delete lastConnectionError.current[instanceId];
    }
  };
  
  // Check instance status with throttling and concurrency protection
  const checkInstanceStatus = async (instanceId: string, forceFresh: boolean = false) => {
    // Find instance by ID
    const instance = window._whatsAppInstancesState?.instances?.find(i => i.id === instanceId);
    if (!instance || !instance.instanceName) {
      console.error(`Instance not found for ID: ${instanceId}`);
      return "unknown";
    }
    
    const instanceName = instance.instanceName;
    
    // Prevent concurrent checks for the same instance
    if (instanceCheckInProgress.current[instanceId]) {
      console.log(`Status check already in progress for instance ${instanceId}, skipping`);
      return;
    }
    
    // Throttle requests - but allow forced checks to bypass throttle
    const now = Date.now();
    const lastCheck = lastCheckTime.current[instanceId] || 0;
    const minInterval = connectingInstances.current.has(instanceId) ? 2000 : 5000; // More frequent checks for connecting instances
    
    if (!forceFresh && now - lastCheck < minInterval) {
      console.log(`Throttling status check for instance ${instanceId} - too soon`);
      return;
    }
    
    try {
      console.log(`Checking status of instance: ${instanceName}`);
      
      // Mark this instance as being checked
      instanceCheckInProgress.current[instanceId] = true;
      lastCheckTime.current[instanceId] = now;
      setIsLoading(prev => ({ ...prev, [instanceId]: true }));
      
      // Get current instance status via Evolution API
      const status = await evolutionApiService.checkInstanceStatus(instanceName);
      console.log(`Status of instance ${instanceName}: ${status}`);
      
      // If device is connected, get additional device info
      if (status === 'connected') {
        try {
          const deviceInfo = await evolutionApiService.getDeviceInfo(instanceName);
          if (deviceInfo && deviceInfo.status === 'success') {
            // Update device info in store
            if (window._whatsAppInstancesStore) {
              const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
              updateInstance(instanceId, { 
                connected: true,
                deviceInfo: {
                  batteryLevel: deviceInfo.device?.battery?.value || 0,
                  deviceModel: deviceInfo.device?.phone?.device_model || "Unknown device",
                  whatsappVersion: deviceInfo.device?.wa_version || "Unknown version",
                  lastConnectionTime: new Date().toISOString(),
                  platformType: deviceInfo.device?.platform || "Unknown platform"
                }
              });
            }
            
            // Limpar rastreamento de erros já que conectamos com sucesso
            clearErrorTracking(instanceId);
          }
        } catch (error) {
          console.error("Error getting device information:", error);
          
          // Tente um fallback para obter pelo menos o número de telefone
          try {
            // Fix: Use evolutionApiService instead of direct apiClient access
            const infoData = await evolutionApiService.checkInstanceStatus(instanceName);
            
            // Atualizar telefone no store
            if (window._whatsAppInstancesStore) {
              const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
              updateInstance(instanceId, { 
                phoneNumber: undefined,
              });
            }
          } catch (fallbackError) {
            console.error("Erro também no fallback para info:", fallbackError);
          }
        }
      }
      
      // Update status in database
      if (instanceId !== "1") {
        try {
          await updateInstanceStatusAndPhone(instanceId, status);
          
          // If the instance was in connecting state and is now connected, remove from connecting set
          if (status === 'connected' && connectingInstances.current.has(instanceId)) {
            console.log(`Instance ${instanceName} is now connected, removing from connecting instances`);
            connectingInstances.current.delete(instanceId);
            
            // Registrar conexão bem sucedida
            await updateConnectionAttempt(instanceId, true);
          }
          
          // Update global state (this is handled by store updates in our new architecture)
          if (window._whatsAppInstancesStore) {
            const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
            updateInstance(instanceId, { connected: status === 'connected' });
          }
          
        } catch (error) {
          console.error("Error updating status in database:", error);
          await updateConnectionAttempt(instanceId, false, error instanceof Error ? error.message : String(error));
        }
      }
      
      return status;
    } catch (error) {
      console.error(`Error checking status of instance ${instanceId}:`, error);
      
      // Rastrear erro e verificar se devemos continuar com verificações frequentes
      const shouldContinue = trackConnectionError(instanceId);
      if (!shouldContinue && connectingInstances.current.has(instanceId)) {
        console.log(`Removendo instância ${instanceId} do monitoramento frequente devido a erros repetidos`);
        connectingInstances.current.delete(instanceId);
      }
      
      await updateConnectionAttempt(instanceId, false, error instanceof Error ? error.message : String(error));
      return "disconnected";
    } finally {
      setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      // Release the lock after a short delay to prevent immediate rechecking
      setTimeout(() => {
        instanceCheckInProgress.current[instanceId] = false;
      }, 500);
    }
  };

  // Set up periodic status checks for multiple instances
  const setupPeriodicStatusCheck = (
    instances: WhatsAppInstance[], 
    checkInterval: number = 15000
  ) => {
    if (!instances.length) return null;
    
    // Add to window for access by other components
    if (!window._whatsAppInstancesState) {
      window._whatsAppInstancesState = { instances };
    } else {
      window._whatsAppInstancesState.instances = instances;
    }
    
    console.log("Starting periodic status check for", instances.length, "instances");
    
    // First immediate check with staggered timing to prevent API flooding
    const checkAllInstances = async () => {
      console.log("Checking status of all instances...");
      
      // First, check instances that are connecting (higher priority)
      const connectingInstanceIds = Array.from(connectingInstances.current);
      console.log(`${connectingInstanceIds.length} instances are in connecting state with higher priority checking`);
      
      for (let i = 0; i < connectingInstanceIds.length; i++) {
        const instanceId = connectingInstanceIds[i];
        // Add a slight delay between each check to prevent API flooding
        setTimeout(() => {
          // Force fresh checks for connecting instances
          checkInstanceStatus(instanceId, true);
        }, i * 500); 
      }
      
      // Then check disconnected instances (medium priority)
      const disconnectedInstances = instances.filter(
        instance => !instance.connected && !connectingInstances.current.has(instance.id)
      );
      
      // Stagger the checks to avoid hammering the API
      for (let i = 0; i < disconnectedInstances.length; i++) {
        const instance = disconnectedInstances[i];
        // Add a delay between each check to prevent API flooding
        setTimeout(() => {
          checkInstanceStatus(instance.id);
        }, (connectingInstanceIds.length * 500) + (i * 1000)); // Stagger after connecting instances
      }
      
      // Finally check connected instances (lowest priority)
      const connectedInstances = instances.filter(instance => instance.connected);
      for (let i = 0; i < connectedInstances.length; i++) {
        const instance = connectedInstances[i];
        // Check connected instances less frequently
        setTimeout(() => {
          checkInstanceStatus(instance.id);
        }, (connectingInstanceIds.length * 500) + (disconnectedInstances.length * 1000) + (i * 1000));
      }
    };
    
    // Run the first check immediately
    checkAllInstances();
    
    // Set up periodic check
    const intervalId = setInterval(checkAllInstances, checkInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  };

  // Add an instance to the priority-checking list
  const addConnectingInstance = (instanceId: string) => {
    console.log(`Adding instance ${instanceId} to connecting instances for priority checking`);
    connectingInstances.current.add(instanceId);
    // Immediately check status
    checkInstanceStatus(instanceId, true);
  };

  return {
    checkInstanceStatus,
    setupPeriodicStatusCheck,
    addConnectingInstance,
    isLoading
  };
};

// Declare global window types
declare global {
  interface Window {
    _whatsAppInstancesState?: {
      instances: WhatsAppInstance[];
    };
    _whatsAppInstancesStore?: any;
  }
}
