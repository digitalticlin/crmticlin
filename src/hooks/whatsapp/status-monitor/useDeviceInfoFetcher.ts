
import { useState } from "react";
import { evolutionApiService } from "@/services/evolution-api";

/**
 * Hook for fetching WhatsApp device information
 */
export const useDeviceInfoFetcher = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  /**
   * Fetch device information for a connected instance
   */
  const fetchDeviceInfo = async (instanceId: string, instanceName: string) => {
    try {
      console.log(`Fetching device info for instance: ${instanceName}`);
      setIsLoading(prev => ({ ...prev, [instanceId]: true }));

      // Get device info via Evolution API
      const deviceInfo = await evolutionApiService.getDeviceInfo(instanceName);
      
      if (deviceInfo && deviceInfo.status === 'success') {
        console.log(`Device info retrieved successfully for ${instanceName}`);
        
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
        
        return true;
      } else {
        console.log("Device info response was invalid or unsuccessful:", deviceInfo);
        return false;
      }
    } catch (error) {
      console.error("Error fetching device information:", error);
      return false;
    } finally {
      setIsLoading(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  /**
   * Attempt to get phone number when device info fails
   */
  const fetchPhoneNumber = async (instanceId: string, instanceName: string) => {
    try {
      // Use fallback to get at least the phone number
      const infoData = await evolutionApiService.checkInstanceStatus(instanceName);
      
      if (infoData === 'connected' && window._whatsAppInstancesStore) {
        // Try to get phone info using another endpoint
        try {
          // Use instance info endpoint through the service
          const instanceInfo = await evolutionApiService.apiClient.fetchWithHeaders(
            `/instance/info/${instanceName}`, 
            { method: "GET" }
          );
          
          if (instanceInfo?.instance?.phone) {
            const updateInstance = window._whatsAppInstancesStore.getState().actions.updateInstance;
            updateInstance(instanceId, { 
              phoneNumber: instanceInfo.instance.phone,
            });
            return true;
          }
        } catch (fallbackError) {
          console.error("Error in phone number fallback:", fallbackError);
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error in phone number fallback:", error);
      return false;
    }
  };

  return {
    fetchDeviceInfo,
    fetchPhoneNumber,
    isLoading
  };
};

// Declare global window types - duplicated here since this file might be used independently
declare global {
  interface Window {
    _whatsAppInstancesState?: {
      instances: any[];
    };
    _whatsAppInstancesStore?: any;
  }
}
