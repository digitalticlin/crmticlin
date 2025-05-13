
import { useState } from "react";
import { toast } from "sonner";
import { useWhatsAppInstanceActions, useWhatsAppInstanceState, WhatsAppInstance } from "./whatsappInstanceStore";
import { useWhatsAppConnector } from "./useWhatsAppConnector";

/**
 * Hook for creating new WhatsApp instances
 */
export const useWhatsAppCreator = (companyId: string | null) => {
  const [instanceName, setInstanceName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [lastError, setLastError] = useState<string | null>(null);
  
  const { instances } = useWhatsAppInstanceState();
  const { setInstances } = useWhatsAppInstanceActions();
  const { connectInstance } = useWhatsAppConnector();
  
  // Add new instance function with additional checks to prevent duplicates
  const addNewInstance = async (username: string) => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    
    if (!companyId) {
      toast.error("No company associated with user");
      return;
    }

    // Check if we already have an instance with this name in our local state
    const existingLocalInstance = instances.find(
      i => i.instanceName.toLowerCase() === username.toLowerCase() ||
           i.instanceName.toLowerCase().startsWith(username.toLowerCase())
    );
    
    if (existingLocalInstance) {
      console.log(`Instance with similar name already exists locally: ${existingLocalInstance.instanceName}`);
      toast.info("An instance with this name already exists. Modifying name to create a new one.");
      
      // Append a number to make it unique
      username = `${username}1`;
    }
    
    try {
      // Create new local instance
      const newInstanceId = crypto.randomUUID();
      const newInstance: WhatsAppInstance = {
        id: newInstanceId,
        instanceName: username.trim(),
        connected: false,
      };
      
      // Add to local state
      setInstances([newInstance, ...instances]);
      
      // Connect the instance - this checks if an instance with the same name already exists
      // and will add a sequential number if needed
      const qrCodeUrl = await connectInstance(newInstance);
      
      // Return the instance with QR Code
      return {
        ...newInstance,
        qrCodeUrl
      };
    } catch (error) {
      console.error("Error adding new instance:", error);
      toast.error("Could not add new instance");
      setLastError("Error adding new instance");
      throw error;
    }
  };

  return {
    instanceName,
    setInstanceName,
    isLoading,
    setIsLoading,
    lastError,
    setLastError,
    addNewInstance
  };
};
