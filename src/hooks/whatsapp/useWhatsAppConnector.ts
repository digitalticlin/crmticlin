
import { toast } from "sonner";
import { evolutionApiService } from "@/services/evolution-api";
import { 
  useWhatsAppInstanceActions,
  WhatsAppInstance 
} from "./whatsappInstanceStore";
import {
  saveInstanceToDatabase,
  updateQrCodeInDatabase
} from "./useWhatsAppDatabase";

/**
 * Hook for connecting and updating WhatsApp instances
 */
export const useWhatsAppConnector = () => {
  const { updateInstance, setLoading, setError } = useWhatsAppInstanceActions();

  // Connect a new WhatsApp instance
  const connectInstance = async (instance: WhatsAppInstance) => {
    const instanceId = instance.id;
    setLoading(instanceId, true);
    setError(null);
    
    try {
      if (!instance) {
        throw new Error("Instance not found");
      }
      
      console.log(`Connecting WhatsApp instance ${instance.instanceName} (ID: ${instanceId})`);
      
      // Check if instances with same name already exist
      let existingInstances = [];
      try {
        existingInstances = await evolutionApiService.fetchInstances();
        console.log("Existing instances:", existingInstances);
      } catch (fetchError) {
        console.log("Error fetching instances, continuing with empty list:", fetchError);
        // Continue with empty list if unable to fetch instances
      }
      
      // Check if an instance with this name already exists and adjust if needed
      let finalInstanceName = instance.instanceName;
      let counter = 1;
      
      // Check if instance with same name exists and add sequential number if needed
      while(existingInstances.some(i => i.instanceName.toLowerCase() === finalInstanceName.toLowerCase())) {
        finalInstanceName = `${instance.instanceName}${counter}`;
        counter++;
        console.log(`Name already exists, trying new name: ${finalInstanceName}`);
      }
      
      // If name was changed, update the instance
      if (finalInstanceName !== instance.instanceName) {
        console.log(`Instance name adjusted from ${instance.instanceName} to ${finalInstanceName}`);
        instance.instanceName = finalInstanceName;
        updateInstance(instanceId, { instanceName: finalInstanceName });
      }
      
      // Create instance in Evolution API
      console.log(`Creating instance in Evolution API: ${finalInstanceName}`);
      const result = await evolutionApiService.createInstance(finalInstanceName);
      
      if (!result) {
        console.error("API returned null or empty result");
        throw new Error("Invalid API response");
      }
      
      console.log("Instance creation result:", result);
      console.log("QR code in response:", result.qrcode);
      
      if (!result.qrcode || !result.qrcode.base64) {
        console.error("QR code missing in API response");
        throw new Error("QR Code not available in API response");
      }
      
      const qrCodeUrl = result.qrcode.base64;
      console.log(`QR code successfully generated for ${result.instanceName}`);
      console.log("QR code URL base64 (first 50 characters):", qrCodeUrl.substring(0, 50));
      
      // Save to Supabase
      console.log("Saving instance in database with QR code...");
      let updatedInstance;
      
      try {
        updatedInstance = await saveInstanceToDatabase(instance, qrCodeUrl, result);
        console.log("Instance saved in database:", updatedInstance);
      } catch (dbError) {
        console.error("Error saving to database, but continuing with QR code:", dbError);
        // Even in case of database error, still return QR code for display
      }
      
      // Update local state with new QR code, even in case of database failure
      updateInstance(instanceId, {
        id: updatedInstance?.id || instanceId,
        instanceName: updatedInstance?.instance_name || instance.instanceName,
        connected: false,
        qrCodeUrl
      });
      
      toast.success("QR Code generated successfully!");
      return qrCodeUrl;
    } catch (error: any) {
      const errorMessage = error?.message || "Unknown error";
      console.error(`Complete error connecting WhatsApp:`, error);
      handleOperationError(error, `connect WhatsApp: ${errorMessage}`);
      throw error;
    } finally {
      setLoading(instanceId, false);
    }
  };

  // Update QR Code for an instance using forced connection
  const refreshQrCode = async (instance: WhatsAppInstance) => {
    const instanceId = instance.id;
    setLoading(instanceId, true);
    setError(null);
    
    try {
      if (!instance) {
        throw new Error("Instance not found");
      }
      
      console.log(`Updating QR code for instance: ${instance.instanceName} (ID: ${instanceId})`);
      
      // Use connectInstance method to generate new QR code (instead of refreshQrCode)
      // This change is crucial, as the connect endpoint forces a new connection and QR code
      console.log(`Using connectInstance method to generate new QR code for: ${instance.instanceName}`);
      const qrCodeUrl = await evolutionApiService.connectInstance(instance.instanceName);
      
      if (!qrCodeUrl) {
        console.error("API did not return QR code in update");
        throw new Error("QR Code not available in API response");
      }
      
      console.log("New QR code obtained (first 50 characters):", qrCodeUrl.substring(0, 50));
      
      // Update in Supabase
      try {
        console.log("Updating QR code in database...");
        await updateQrCodeInDatabase(instanceId, qrCodeUrl);
      } catch (dbError) {
        console.error("Error updating QR code in database, but continuing with display:", dbError);
        // Continue even in case of database error
      }
      
      // Update local state with new QR code
      updateInstance(instanceId, {
        connected: false,
        qrCodeUrl
      });
      
      toast.success("QR Code updated successfully!");
      return qrCodeUrl;
    } catch (error) {
      handleOperationError(error, "update QR Code");
      throw error;
    } finally {
      setLoading(instanceId, false);
    }
  };

  // Check connection status of an instance
  const checkConnectionStatus = async (instance: WhatsAppInstance) => {
    if (!instance || !instance.instanceName) return false;
    
    try {
      const status = await evolutionApiService.checkInstanceStatus(instance.instanceName);
      const connected = status === 'connected';
      
      updateInstance(instance.id, { connected });
      return connected;
    } catch (error) {
      console.error(`Error checking connection status for ${instance.instanceName}:`, error);
      return false;
    }
  };

  // Handle operation errors and display toast
  const handleOperationError = (error: any, operation: string) => {
    const errorMessage = error?.message || "Unknown error";
    console.error(`Error during operation: ${operation}:`, error);
    toast.error(`Error ${operation}. ${errorMessage}`);
    setError(`Error ${operation}. ${errorMessage}`);
  };

  return {
    connectInstance,
    refreshQrCode,
    checkConnectionStatus,
    handleOperationError
  };
};
