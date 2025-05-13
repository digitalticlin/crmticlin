
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { evolutionApiService } from "@/services/evolutionApiService";
import { supabase } from "@/integrations/supabase/client";
import { 
  useWhatsAppInstanceState,
  useWhatsAppInstanceActions,
  WhatsAppInstance
} from "./whatsappInstanceStore";
import {
  saveInstanceToDatabase,
  updateInstanceDisconnectedStatus,
  updateQrCodeInDatabase
} from "./useWhatsAppDatabase";

export const useWhatsAppInstances = (userEmail: string) => {
  const { instances, isLoading, lastError } = useWhatsAppInstanceState();
  const { setInstances, setLoading, setError, updateInstance } = useWhatsAppInstanceActions();
  
  // Generate instance name based on email (part before @)
  const instanceName = userEmail ? userEmail.split('@')[0] : "";
  
  // Load user instances from Supabase
  useEffect(() => {
    if (!userEmail) return;
    fetchUserInstances();
  }, [userEmail, instanceName]);
  
  // Fetch user instances from database
  const fetchUserInstances = async () => {
    try {
      console.log(`Fetching WhatsApp instances for user: ${userEmail}, base instance name: ${instanceName}`);
      setError(null);
      
      // Fetch user instances from Supabase
      const { data, error } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('instance_name', instanceName);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`Found ${data.length} WhatsApp instances for user ${userEmail}`);
        const mappedInstances = mapDatabaseInstancesToState(data);
        setInstances(mappedInstances);
      } else {
        console.log(`No WhatsApp instances found for user ${userEmail}, creating placeholder`);
        // If no instances found, create a placeholder
        setInstances([
          { id: "1", instanceName, connected: false }
        ]);
      }
    } catch (error) {
      console.error(`Error fetching WhatsApp instances for ${userEmail}:`, error);
      setError("Erro ao carregar instâncias WhatsApp");
      toast.error("Erro ao carregar instâncias WhatsApp");
      setInstances([
        { id: "1", instanceName, connected: false }
      ]);
    }
  };

  // Map database data to application state format
  const mapDatabaseInstancesToState = (data: any[]): WhatsAppInstance[] => {
    return data.map(instance => ({
      id: instance.id,
      instanceName: instance.instance_name,
      connected: instance.status === 'connected',
      qrCodeUrl: instance.qr_code
    }));
  };
  
  // Connect a new WhatsApp instance
  const connectInstance = async (instanceId: string) => {
    setLoading(instanceId, true);
    setError(null);
    
    try {
      // Find the instance to connect
      const instance = findInstanceById(instanceId);
      if (!instance) {
        throw new Error("Instância não encontrada");
      }
      
      console.log(`Connecting WhatsApp instance ${instance.instanceName} (ID: ${instanceId})`);
      
      // Create instance in Evolution API
      const result = await evolutionApiService.createInstance(instance.instanceName);
      
      if (!result) {
        throw new Error("Não foi possível criar a instância");
      }
      
      if (!result.qrcode || !result.qrcode.base64) {
        throw new Error("QR Code não disponível");
      }
      
      const qrCodeUrl = result.qrcode.base64;
      console.log(`Successfully generated QR code for ${result.instanceName}`);
      
      // Save to Supabase
      const updatedInstance = await saveInstanceToDatabase(instance, qrCodeUrl, result);
      
      // Update local state with the new QR code
      updateInstance(instanceId, {
        id: updatedInstance.id,
        instanceName: updatedInstance.instance_name,
        connected: false,
        qrCodeUrl
      });
      
      toast.success("QR Code gerado com sucesso!");
      return qrCodeUrl;
    } catch (error: any) {
      const errorMessage = error?.message || "Erro desconhecido";
      handleOperationError(error, `conectar WhatsApp: ${errorMessage}`);
      throw error;
    } finally {
      setLoading(instanceId, false);
    }
  };

  // Find instance by ID
  const findInstanceById = (instanceId: string): WhatsAppInstance | undefined => {
    return instances.find(i => i.id === instanceId);
  };
  
  // Delete a WhatsApp instance
  const deleteInstance = async (instanceId: string) => {
    setLoading(instanceId, true);
    setError(null);
    
    try {
      // Find instance in local state
      const instance = findInstanceById(instanceId);
      if (!instance) {
        throw new Error("Instância não encontrada");
      }
      
      console.log(`Deleting WhatsApp instance: ${instance.instanceName} (ID: ${instanceId})`);
      
      // Delete from Evolution API
      const success = await evolutionApiService.deleteInstance(instance.instanceName);
      
      if (!success) {
        throw new Error("Falha ao remover instância na API");
      }
      
      // Update in Supabase
      await updateInstanceDisconnectedStatus(instanceId);
      
      // Update local state
      updateInstance(instanceId, {
        connected: false,
        qrCodeUrl: undefined
      });
      
      toast.success("WhatsApp desconectado com sucesso!");
    } catch (error) {
      handleOperationError(error, "desconectar WhatsApp");
      throw error;
    } finally {
      setLoading(instanceId, false);
    }
  };
  
  // Refresh QR Code for an instance
  const refreshQrCode = async (instanceId: string) => {
    setLoading(instanceId, true);
    setError(null);
    
    try {
      // Find instance in local state
      const instance = findInstanceById(instanceId);
      if (!instance) {
        throw new Error("Instância não encontrada");
      }
      
      console.log(`Refreshing QR code for instance: ${instance.instanceName} (ID: ${instanceId})`);
      
      // Get new QR Code from Evolution API
      const result = await evolutionApiService.createInstance(instance.instanceName);
      
      if (!result || !result.qrcode || !result.qrcode.base64) {
        throw new Error("Não foi possível obter um novo QR Code");
      }
      
      const qrCodeUrl = result.qrcode.base64;
      
      // Update in Supabase
      await updateQrCodeInDatabase(instanceId, qrCodeUrl);
      
      // Update local state with the new QR code
      updateInstance(instanceId, {
        connected: false,
        qrCodeUrl
      });
      
      toast.success("QR Code atualizado com sucesso!");
      return qrCodeUrl;
    } catch (error) {
      handleOperationError(error, "atualizar QR Code");
      throw error;
    } finally {
      setLoading(instanceId, false);
    }
  };

  // Handle operation errors and show toast
  const handleOperationError = (error: any, operation: string) => {
    const errorMessage = error?.message || "Erro desconhecido";
    console.error(`Error during operation: ${operation}:`, error);
    toast.error(`Erro ao ${operation}. ${errorMessage}`);
    setError(`Erro ao ${operation}. ${errorMessage}`);
  };
  
  return {
    instances,
    isLoading,
    instanceName,
    lastError,
    connectInstance,
    deleteInstance,
    refreshQrCode
  };
};
