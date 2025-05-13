
import { useState } from "react";
import { toast } from "sonner";
import { useWhatsAppInstanceState, WhatsAppInstance } from "./whatsappInstanceStore";
import { evolutionApiService } from "@/services/evolution-api";
import { updateQrCodeInDatabase } from "./database/updateQrCode";
import { updateInstanceStatusAndPhone } from "./database/updateInstanceStatus";

export const useWhatsAppConnector = () => {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [lastError, setLastError] = useState<string | null>(null);
  const { instances } = useWhatsAppInstanceState();

  /**
   * Connects a WhatsApp instance and returns a QR code
   */
  const connectInstance = async (instanceIdOrInstance: string | WhatsAppInstance): Promise<string> => {
    try {
      // Check if instanceId is a string or a WhatsAppInstance object
      const instance = typeof instanceIdOrInstance === 'string' 
        ? instances.find(i => i.id === instanceIdOrInstance)
        : instanceIdOrInstance;
      
      if (!instance) {
        throw new Error("Invalid instance");
      }

      const instanceName = instance.instanceName;
      const instanceId = typeof instanceIdOrInstance === 'string' 
        ? instanceIdOrInstance 
        : instance.id;
      
      console.log(`Connecting instance ${instanceId}: ${instanceName}`);
      setIsLoading(prev => ({ ...prev, [instanceId]: true }));
      setLastError(null);
      
      // Connect to Evolution API
      console.log(`Calling Evolution API to connect instance: ${instanceName}`);
      const qrCode = await evolutionApiService.connectInstance(instanceName);
      
      if (!qrCode) {
        console.error("Failed to get QR code from Evolution API");
        throw new Error("Failed to get QR code from Evolution API");
      }
      
      console.log(`QR Code received for ${instanceName} (first 50 chars): ${qrCode.substring(0, 50)}`);
      
      // Save QR code to database
      try {
        console.log(`Saving QR code to database for instance ID: ${instanceId}`);
        await updateQrCodeInDatabase(instanceId, qrCode);
        console.log(`QR code saved to database for ${instanceName}`);
      } catch (dbError) {
        console.error("Error updating QR code in database:", dbError);
        // Continue even if DB update fails
      }
      
      // Return the QR code
      return qrCode;
    } catch (error: any) {
      console.error("Error connecting instance:", error);
      toast.error("Error connecting WhatsApp instance");
      setLastError(error?.message || "Error connecting WhatsApp instance");
      throw error;
    } finally {
      const instanceId = typeof instanceIdOrInstance === 'string' 
        ? instanceIdOrInstance 
        : instanceIdOrInstance.id;
      setIsLoading(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  /**
   * Refreshes the QR code for a WhatsApp instance
   */
  const refreshQrCode = async (instanceName: string): Promise<string | null> => {
    try {
      setIsLoading(prev => ({ ...prev, [instanceName]: true }));
      setLastError(null);
      
      // Refresh QR code from Evolution API
      const qrCode = await evolutionApiService.refreshQrCode(instanceName);
      
      if (!qrCode) {
        throw new Error("Failed to refresh QR code from Evolution API");
      }
      
      // Save QR code to database
      const instance = instances.find(i => i.instanceName === instanceName);
      if (instance) {
        await updateQrCodeInDatabase(instance.id, qrCode);
      }
      
      return qrCode;
    } catch (error: any) {
      console.error("Error updating QR code:", error);
      toast.error("Error updating QR code");
      setLastError(error?.message || "Error updating QR code");
      return null;
    } finally {
      setIsLoading(prev => ({ ...prev, [instanceName]: false }));
    }
  };

  /**
   * Checks the connection status of a WhatsApp instance
   */
  const checkInstanceStatus = async (instanceId: string): Promise<"connected" | "connecting" | "disconnected"> => {
    try {
      setIsLoading(prev => ({ ...prev, [instanceId]: true }));
      setLastError(null);
      
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error("Instance not found");
      }
      
      // Check status from Evolution API
      const status = await evolutionApiService.checkInstanceStatus(instance.instanceName);
      
      // Update status and phone number in database
      if (status === 'connected') {
        await updateInstanceStatusAndPhone(instanceId, status, instance.phoneNumber);
      } else {
        await updateInstanceStatusAndPhone(instanceId, status);
      }
      
      return status;
    } catch (error: any) {
      console.error("Error checking instance status:", error);
      setLastError(error?.message || "Error checking WhatsApp instance status");
      return "disconnected";
    } finally {
      setIsLoading(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  return {
    isLoading,
    lastError,
    connectInstance,
    refreshQrCode,
    checkInstanceStatus
  };
};
