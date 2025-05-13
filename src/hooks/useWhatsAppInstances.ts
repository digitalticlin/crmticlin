
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { evolutionApiService } from "@/services/evolutionApiService";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppInstance {
  id: string;
  instanceName: string;
  connected: boolean;
  qrCodeUrl?: string;
}

export const useWhatsAppInstances = (userEmail: string) => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [lastError, setLastError] = useState<string | null>(null);
  
  // Generate instance name based on email (part before @)
  const instanceName = userEmail ? userEmail.split('@')[0] : "";
  
  // Load user instances from Supabase
  useEffect(() => {
    if (!userEmail) return;
    fetchUserInstances();
  }, [userEmail, instanceName]);
  
  const fetchUserInstances = async () => {
    try {
      console.log(`Fetching WhatsApp instances for user: ${userEmail}, base instance name: ${instanceName}`);
      setLastError(null);
      
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
        
        // Se tiver QR code disponível, vamos garantir que o estado reflete isso
        const hasQrInstance = mappedInstances.find(instance => instance.qrCodeUrl);
        if (hasQrInstance) {
          console.log(`Found instance with QR code: ${hasQrInstance.instanceName}`);
        }
      } else {
        console.log(`No WhatsApp instances found for user ${userEmail}, creating placeholder`);
        // If no instances found, create a placeholder
        setInstances([
          { id: "1", instanceName, connected: false }
        ]);
      }
    } catch (error) {
      console.error(`Error fetching WhatsApp instances for ${userEmail}:`, error);
      setLastError("Erro ao carregar instâncias WhatsApp");
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
    setLoadingState(instanceId, true);
    setLastError(null);
    
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
      
      // Update local state
      updateLocalInstanceState(instance, updatedInstance, qrCodeUrl);
      
      toast.success("QR Code gerado com sucesso!");
      return qrCodeUrl;
    } catch (error: any) {
      const errorMessage = error?.message || "Erro desconhecido";
      handleOperationError(error, `conectar WhatsApp: ${errorMessage}`);
      throw error;
    } finally {
      setLoadingState(instanceId, false);
    }
  };

  // Find instance by ID
  const findInstanceById = (instanceId: string): WhatsAppInstance | undefined => {
    return instances.find(i => i.id === instanceId);
  };

  // Save instance to database
  const saveInstanceToDatabase = async (instance: WhatsAppInstance, qrCodeUrl: string, result: any) => {
    console.log(`Saving instance to database: ${instance.instanceName}`);
    
    try {
      // Gere um UUID aleatório para novas instâncias
      const instanceId = instance.id === "1" ? undefined : instance.id;
      
      const { error, data } = await supabase
        .from('whatsapp_numbers')
        .upsert({
          id: instanceId, // Let Supabase generate ID for new records
          instance_name: instance.instanceName,
          phone: "", // Will be updated when connected
          company_id: "your_company_id", // Replace with user's company ID
          status: "connecting",
          qr_code: qrCodeUrl,
          instance_id: result.instanceId,
          evolution_instance_name: result.instanceName
        }, { onConflict: 'instance_name' })
        .select();  // Return the inserted/updated data
    
      if (error) {
        console.error("Error saving instance to database:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        // Fetch the inserted/updated record if select didn't return it
        const { data: fetchedData, error: fetchError } = await supabase
          .from('whatsapp_numbers')
          .select('*')
          .eq('instance_name', instance.instanceName)
          .limit(1);
          
        if (fetchError || !fetchedData || fetchedData.length === 0) {
          throw new Error("Error retrieving instance after saving");
        }
        
        return fetchedData[0];
      }
      
      return data[0];
    } catch (error) {
      console.error("Failed to save instance to database:", error);
      throw new Error("Erro ao salvar a instância no banco de dados");
    }
  };

  // Update local instance state
  const updateLocalInstanceState = (oldInstance: WhatsAppInstance, databaseInstance: any, qrCodeUrl: string) => {
    setInstances(prev => 
      prev.map(i => 
        i.instanceName === oldInstance.instanceName
          ? {
              id: databaseInstance.id,
              instanceName: databaseInstance.instance_name,
              connected: false,
              qrCodeUrl
            } 
          : i
      )
    );
  };

  // Set loading state for a specific instance
  const setLoadingState = (instanceId: string, isLoadingState: boolean) => {
    setIsLoading(prev => ({...prev, [instanceId]: isLoadingState}));
  };
  
  // Delete a WhatsApp instance
  const deleteInstance = async (instanceId: string) => {
    setLoadingState(instanceId, true);
    setLastError(null);
    
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
      updateInstanceLocalState(instanceId, false);
      
      toast.success("WhatsApp desconectado com sucesso!");
    } catch (error) {
      handleOperationError(error, "desconectar WhatsApp");
      throw error;
    } finally {
      setLoadingState(instanceId, false);
    }
  };

  // Update instance status to disconnected in database
  const updateInstanceDisconnectedStatus = async (instanceId: string) => {
    if (instanceId === "1") return; // Skip DB update for placeholder ID
    
    console.log(`Updating instance ${instanceId} to disconnected status in database`);
    
    const { error } = await supabase
      .from('whatsapp_numbers')
      .update({
        status: 'disconnected',
        date_disconnected: new Date().toISOString(),
        qr_code: null
      })
      .eq('id', instanceId);
      
    if (error) {
      console.error("Error updating instance status:", error);
      throw error;
    }
  };

  // Update local instance state
  const updateInstanceLocalState = (instanceId: string, connected: boolean, qrCodeUrl?: string) => {
    setInstances(prev => 
      prev.map(i => 
        i.id === instanceId 
          ? {...i, connected, qrCodeUrl} 
          : i
      )
    );
  };
  
  // Refresh QR Code for an instance
  const refreshQrCode = async (instanceId: string) => {
    setLoadingState(instanceId, true);
    setLastError(null);
    
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
      
      // Update local state
      updateInstanceLocalState(instanceId, false, qrCodeUrl);
      
      toast.success("QR Code atualizado com sucesso!");
      return qrCodeUrl;
    } catch (error) {
      handleOperationError(error, "atualizar QR Code");
      throw error;
    } finally {
      setLoadingState(instanceId, false);
    }
  };

  // Update QR code in database
  const updateQrCodeInDatabase = async (instanceId: string, qrCodeUrl: string) => {
    if (instanceId === "1") return; // Skip DB update for placeholder ID
    
    console.log(`Updating QR code in database for instance ID: ${instanceId}`);
    
    const { error } = await supabase
      .from('whatsapp_numbers')
      .update({ qr_code: qrCodeUrl })
      .eq('id', instanceId);
      
    if (error) {
      console.error("Error updating QR code in database:", error);
      throw error;
    }
  };

  // Handle operation errors and show toast
  const handleOperationError = (error: any, operation: string) => {
    const errorMessage = error?.message || "Erro desconhecido";
    console.error(`Error during operation: ${operation}:`, error);
    toast.error(`Erro ao ${operation}. ${errorMessage}`);
    setLastError(`Erro ao ${operation}. ${errorMessage}`);
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
