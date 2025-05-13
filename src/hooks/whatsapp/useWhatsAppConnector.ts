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
  const connectInstance = async (instanceId: string | WhatsAppInstance): Promise<string> => {
    try {
      // Check if instanceId is a string or a WhatsAppInstance object
      const instanceName = typeof instanceId === 'string' 
        ? instances.find(i => i.id === instanceId)?.instanceName 
        : instanceId.instanceName;
      
      if (!instanceName) {
        throw new Error("Invalid instance");
      }
      
      setIsLoading(prev => ({ ...prev, [instanceName]: true }));
      setLastError(null);
      
      // Connect to Evolution API
      const qrCode = await evolutionApiService.connectInstance(instanceName);
      
      if (!qrCode) {
        throw new Error("Failed to get QR code from Evolution API");
      }
      
      // Save QR code to database
      if (typeof instanceId === 'string') {
        await updateQrCodeInDatabase(instanceId, qrCode);
      } else {
        await updateQrCodeInDatabase(instanceId.id, qrCode);
      }
      
      // Return the QR code
      return qrCode;
    } catch (error: any) {
      console.error("Error connecting instance:", error);
      toast.error("Error connecting WhatsApp instance");
      setLastError(error?.message || "Error connecting WhatsApp instance");
      throw error;
    } finally {
      if (typeof instanceId === 'string') {
        setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      } else {
        setIsLoading(prev => ({ ...prev, [instanceId.instanceName]: false }));
      }
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
