
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  WhatsAppInstance,
  useWhatsAppInstanceActions,
  useWhatsAppInstanceState
} from "./whatsappInstanceStore";

/**
 * Hook for fetching WhatsApp instances from the database
 */
export const useWhatsAppFetcher = (userEmail: string) => {
  const { setInstances, setError } = useWhatsAppInstanceActions();
  
  // Generate instance name based on email (part before @)
  const instanceName = userEmail ? userEmail.split('@')[0] : "";
  
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

  return {
    fetchUserInstances,
    instanceName
  };
};
