
import { useState, useCallback } from "react";
import { evolutionApiService } from "@/services/evolution-api";
import { updateInstanceStatusAndPhone } from "../database";
import { WhatsAppConnectionStatus } from "../database/whatsappDatabaseTypes";
import { toast } from "sonner";

/**
 * Hook for synchronizing WhatsApp instance connection status
 * between Evolution API and local database
 */
export const useConnectionSynchronizer = () => {
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [lastSyncTime, setLastSyncTime] = useState<Record<string, number>>({});
  
  /**
   * Forces a synchronization of connection status from Evolution API to local database
   * @param instanceId The database ID of the instance
   * @param instanceName The Evolution API instance name
   */
  const forceSyncConnectionStatus = useCallback(async (
    instanceId: string, 
    instanceName: string
  ): Promise<WhatsAppConnectionStatus> => {
    if (!instanceId || !instanceName) {
      console.error("Missing required parameters for sync:", { instanceId, instanceName });
      return "disconnected";
    }
    
    console.log(`Forcing synchronization of connection status for: ${instanceName} (ID: ${instanceId})`);
    setIsSyncing(prev => ({ ...prev, [instanceId]: true }));
    
    try {
      // Get current status directly from Evolution API
      const evolutionStatus = await evolutionApiService.checkInstanceStatus(instanceName, true);
      console.log(`Evolution API reports status for ${instanceName}: ${evolutionStatus}`);
      
      // Se receber "open", trate como "connected"!
      const status = typeof evolutionStatus === 'string' 
        ? evolutionStatus 
        : evolutionStatus?.instance?.state || evolutionStatus?.state || 'disconnected';
      
      // Aqui o ajuste principal: "open" será tratado como sucesso/conectado
      const mappedStatus: WhatsAppConnectionStatus = 
        status === 'connected' || status === 'open' ? 'open' :
        status === 'connecting' ? 'connecting' : 
        'closed';
      
      // Get phone number for connected instances
      let phone: string | undefined = undefined;
      if (mappedStatus === 'open') {
        try {
          const deviceInfo = await evolutionApiService.getDeviceInfo(instanceName);
          if (deviceInfo && deviceInfo.phone) {
            phone = deviceInfo.phone.number;
          }
        } catch (phoneError) {
          console.error("Could not retrieve phone number:", phoneError);
        }
      }
      
      // Update status in database
      await updateInstanceStatusAndPhone(instanceId, mappedStatus, phone);
      console.log(`Database status updated for ${instanceName} to ${mappedStatus}`);
      
      // Update local state for timing
      setLastSyncTime(prev => ({ ...prev, [instanceId]: Date.now() }));
      
      // Update global state if available
      if (window._whatsAppInstancesStore) {
        const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
        updateInstance(instanceId, { 
          connected: mappedStatus === 'open',
          phoneNumber: phone
        });
      }
      
      return mappedStatus;
    } catch (error) {
      console.error(`Error synchronizing status for ${instanceName}:`, error);
      toast.error(`Falha ao sincronizar status do WhatsApp: ${instanceName}`);
      return "closed";
    } finally {
      setIsSyncing(prev => ({ ...prev, [instanceId]: false }));
    }
  }, []);
  
  /**
   * Synchronizes all instances in the provided array
   */
  const syncAllInstances = useCallback(async (instances: Array<{
    id: string;
    instanceName: string;
  }>) => {
    console.log(`Synchronizing ${instances.length} WhatsApp instances`);
    const results: Record<string, WhatsAppConnectionStatus> = {};
    
    for (const instance of instances) {
      try {
        results[instance.id] = await forceSyncConnectionStatus(
          instance.id, 
          instance.instanceName
        );
      } catch (error) {
        console.error(`Error syncing instance ${instance.instanceName}:`, error);
        results[instance.id] = "closed";
      }
    }
    
    return results;
  }, [forceSyncConnectionStatus]);
  
  return {
    forceSyncConnectionStatus,
    syncAllInstances,
    isSyncing,
    lastSyncTime
  };
};
