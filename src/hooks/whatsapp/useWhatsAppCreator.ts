
import { useState } from "react";
import { toast } from "sonner";
import { useWhatsAppInstanceActions, useWhatsAppInstanceState, WhatsAppInstance } from "./whatsappInstanceStore";
import { useWhatsAppConnector } from "./useWhatsAppConnector";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook for creating new WhatsApp instances
 */
export const useWhatsAppCreator = (companyId: string | null) => {
  const [instanceName, setInstanceName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [lastError, setLastError] = useState<string | null>(null);
  
  const { instances } = useWhatsAppInstanceState();
  const { updateInstance, addInstance } = useWhatsAppInstanceActions();
  const { connectInstance } = useWhatsAppConnector();
  
  /**
   * Generates a unique sequential instance name based on existing instances
   * If username exists, adds sequential numbers (username1, username2, etc.)
   */
  const generateUniqueInstanceName = (baseUsername: string): string => {
    if (!baseUsername.trim()) return "";

    // Check if username already exists in local state
    const existingInstances = instances.filter(
      i => i.instanceName.toLowerCase() === baseUsername.toLowerCase() ||
           i.instanceName.toLowerCase().startsWith(baseUsername.toLowerCase() + "")
    );

    if (existingInstances.length === 0) {
      // Username doesn't exist, use it as is
      return baseUsername.trim();
    }

    // Find highest sequential number
    let highestSeq = 0;
    existingInstances.forEach(instance => {
      const name = instance.instanceName.toLowerCase();
      if (name === baseUsername.toLowerCase()) {
        // If exact match exists, start with 1
        highestSeq = Math.max(highestSeq, 1);
      } else {
        // Check for sequential numbers
        const regex = new RegExp(`^${baseUsername.toLowerCase()}(\\d+)$`);
        const match = name.match(regex);
        if (match && match[1]) {
          const seq = parseInt(match[1], 10);
          highestSeq = Math.max(highestSeq, seq + 1);
        }
      }
    });

    // Return with next sequential number (or 1 if no sequential numbers found)
    return highestSeq > 0 ? `${baseUsername}${highestSeq}` : baseUsername;
  };
  
  // Add new instance function with additional checks to prevent duplicates
  const addNewInstance = async (username: string) => {
    if (!username.trim()) {
      console.error("Empty username provided");
      toast.error("Nome de usuário não pode ser vazio");
      return null;
    }
    
    if (!companyId) {
      console.error("No company ID associated with user");
      toast.error("Nenhuma empresa associada ao usuário");
      return null;
    }

    try {
      // Generate a unique name based on the username
      const uniqueInstanceName = generateUniqueInstanceName(username);
      console.log(`Tentando criar instância com nome único: ${uniqueInstanceName}`);
      
      // Create new local instance
      const newInstanceId = crypto.randomUUID();
      const newInstance: WhatsAppInstance = {
        id: newInstanceId,
        instanceName: uniqueInstanceName,
        connected: false,
      };
      
      setIsLoading(prev => ({ ...prev, create: true }));
      
      // Add the instance to local state first so it appears in the UI
      addInstance(newInstance);
      
      // Connect the instance - this will create it in Evolution API
      // and generate a QR code
      console.log("Calling connectInstance with new instance:", newInstance);
      const qrCodeUrl = await connectInstance(newInstance);
      
      if (!qrCodeUrl) {
        throw new Error("Failed to get QR code from Evolution API");
      }
      
      console.log("QR code received, updating instance");
      
      // Update the instance with the QR code
      updateInstance(newInstanceId, {
        qrCodeUrl
      });
      
      // Return the instance with QR Code
      return {
        ...newInstance,
        qrCodeUrl
      };
    } catch (error) {
      console.error("Erro ao adicionar nova instância:", error);
      toast.error("Não foi possível adicionar nova instância");
      setLastError("Erro ao adicionar nova instância");
      throw error;
    } finally {
      setIsLoading(prev => ({ ...prev, create: false }));
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
