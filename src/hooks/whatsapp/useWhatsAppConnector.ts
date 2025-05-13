
import { useState } from "react";
import { toast } from "sonner";
import { WhatsAppInstance } from "./whatsappInstanceStore";
import { evolutionApiService } from "@/services/evolution-api";
import { saveInstanceToDatabase, updateQrCodeInDatabase } from "./database";
import { EvolutionApiResult, CreateInstanceResponse } from "@/services/evolution-api/types";

/**
 * Hook to manage WhatsApp connection operations
 */
export const useWhatsAppConnector = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  /**
   * Connect a WhatsApp instance
   */
  const connectInstance = async (instance: WhatsAppInstance): Promise<string> => {
    try {
      setIsLoading(true);
      setLastError(null);
      
      console.log(`Connecting instance: ${instance.instanceName}`);
      
      // Request QR code from Evolution API
      const result = await evolutionApiService.createInstance(instance.instanceName);
      
      if (!result || !result.qrcode || !result.qrcode.base64) {
        throw new Error("QR code not received from Evolution API");
      }
      
      // Extract QR code from response
      const qrCodeUrl = result.qrcode.base64;
      console.log("QR code received (first 50 chars):", qrCodeUrl.substring(0, 50));
      
      // Create an EvolutionApiResult from the response
      const apiResult: EvolutionApiResult = {
        instance: {
          instanceId: result.instanceId,
          instanceName: result.instanceName,
          integration: result.integration,
          status: result.status
        },
        hash: result.hash || "",
        qrcode: result.qrcode,
        webhook: result.webhook || {},
        websocket: result.websocket || {},
        rabbitmq: result.rabbitmq || {},
        sqs: result.sqs || {},
        settings: result.settings || {}
      };
      
      // Save instance and QR code to database
      const savedInstance = await saveInstanceToDatabase(instance, qrCodeUrl, apiResult);
      console.log("Instance saved to database:", savedInstance);
      
      // Return the QR code URL for display
      return qrCodeUrl;
    } catch (error) {
      console.error("Error connecting WhatsApp instance:", error);
      setLastError(error instanceof Error ? error : new Error("Unknown error connecting WhatsApp"));
      toast.error("Erro ao conectar WhatsApp");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Refresh QR code for an instance
   */
  const refreshQrCode = async (instanceId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setLastError(null);
      
      console.log(`Refreshing QR code for instance ID: ${instanceId}`);
      
      // TODO: Implement refresh QR code logic
      // This would typically call Evolution API to get a new QR code
      // and then update it in the database
      
      // For now, we'll just log this action
      console.log("QR code refresh not fully implemented");
      
      // Simulate updating QR code in database
      // In a real implementation, you would get a new QR code from Evolution API
      // const newQrCode = await evolutionApiService.refreshQrCode(instanceName);
      // await updateQrCodeInDatabase(instanceId, newQrCode);
      
    } catch (error) {
      console.error("Error refreshing QR code:", error);
      setLastError(error instanceof Error ? error : new Error("Unknown error refreshing QR code"));
      toast.error("Erro ao atualizar QR code");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Check connection status of an instance
   */
  const checkConnectionStatus = async (instanceName: string): Promise<string> => {
    try {
      console.log(`Checking connection status for instance: ${instanceName}`);
      
      // Get instance status from Evolution API
      const status = await evolutionApiService.checkInstanceStatus(instanceName);
      console.log(`Status for instance ${instanceName}: ${status}`);
      
      return status;
    } catch (error) {
      console.error(`Error checking connection status for ${instanceName}:`, error);
      return "disconnected";
    }
  };
  
  return {
    connectInstance,
    refreshQrCode,
    checkConnectionStatus,
    isLoading,
    lastError
  };
};
