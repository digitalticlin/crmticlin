
import { useState } from "react";
import { toast } from "sonner";
import { useWhatsAppInstanceActions, useWhatsAppInstanceState, WhatsAppInstance } from "./whatsappInstanceStore";
import { useWhatsAppConnector } from "./useWhatsAppConnector";
import { supabase } from "@/integrations/supabase/client";
import { evolutionApiService } from "@/services/evolution-api";

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
      
      // Try different approaches to create and connect the instance
      console.log("Starting instance creation process with multiple fallback mechanisms");
      let qrCodeUrl: string | null = null;
      
      try {
        // Direct call to Evolution API service to create instance
        console.log("Attempting direct call to Evolution API create instance");
        const createdInstance = await evolutionApiService.createInstance(uniqueInstanceName);
        
        if (createdInstance && createdInstance.qrcode?.base64) {
          console.log("Instance created successfully in Evolution API");
          qrCodeUrl = `data:image/png;base64,${createdInstance.qrcode.base64}`;
          console.log("QR code obtained directly from create call");
        } else {
          console.log("Instance created but no QR code received, attempting to connect");
          // Try connecting to get the QR code
          try {
            qrCodeUrl = await connectInstance(newInstance);
            console.log("QR code obtained from connect call");
          } catch (connectError) {
            console.error("Error connecting to get QR code:", connectError);
            throw new Error("Failed to get QR code after creating instance");
          }
        }
      } catch (apiError) {
        console.error("Error with direct Evolution API call:", apiError);
        
        // Log detailed debug information
        console.log("Current environment:", {
          hostname: window.location.hostname,
          origin: window.location.origin,
          isLocalhost: window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'),
          isLovableProject: window.location.hostname.includes('lovableproject.com')
        });
        
        // Fallback to connectInstance method which may use the proxy
        console.log("Falling back to connectInstance method");
        try {
          qrCodeUrl = await connectInstance(newInstance);
          
          if (!qrCodeUrl) {
            throw new Error("Failed to get QR code from Evolution API");
          }
          
          console.log("QR code received from fallback method");
        } catch (fallbackError) {
          console.error("All fallback methods failed:", fallbackError);
          throw new Error("Failed to create WhatsApp instance after multiple attempts");
        }
      }
      
      if (!qrCodeUrl) {
        throw new Error("Failed to get QR code after all attempts");
      }
      
      // Update the instance with QR code
      updateInstance(newInstanceId, {
        qrCodeUrl,
        status: 'connecting'
      });
      
      console.log("QR code set in instance");
      
      // Return the instance with QR Code
      return {
        ...newInstance,
        qrCodeUrl
      };
    } catch (error) {
      console.error("Erro completo ao adicionar nova instância:", error);
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
