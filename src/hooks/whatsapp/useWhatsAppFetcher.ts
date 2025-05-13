
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  WhatsAppInstance,
  useWhatsAppInstanceActions,
  useWhatsAppInstanceState
} from "./whatsappInstanceStore";

/**
 * Hook para buscar instâncias WhatsApp do banco de dados
 */
export const useWhatsAppFetcher = (userEmail: string) => {
  const { setInstances } = useWhatsAppInstanceState();
  const { setError } = useWhatsAppInstanceActions();
  
  // Gera o nome da instância com base no email (parte antes do @)
  const instanceName = userEmail ? userEmail.split('@')[0] : "";
  
  // Busca as instâncias do usuário no banco de dados
  const fetchUserInstances = async () => {
    try {
      console.log(`Buscando instâncias WhatsApp para usuário: ${userEmail}, nome base da instância: ${instanceName}`);
      setError(null);
      
      // Busca instâncias do usuário do Supabase
      const { data, error } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('instance_name', instanceName);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`Encontradas ${data.length} instâncias WhatsApp para usuário ${userEmail}`);
        const mappedInstances = mapDatabaseInstancesToState(data);
        setInstances(mappedInstances);
      } else {
        console.log(`Nenhuma instância WhatsApp encontrada para usuário ${userEmail}, criando placeholder`);
        // Se não encontrar instâncias, crie um placeholder
        setInstances([
          { id: "1", instanceName, connected: false }
        ]);
      }
    } catch (error) {
      console.error(`Erro ao buscar instâncias WhatsApp para ${userEmail}:`, error);
      setError("Erro ao carregar instâncias WhatsApp");
      toast.error("Erro ao carregar instâncias WhatsApp");
      setInstances([
        { id: "1", instanceName, connected: false }
      ]);
    }
  };

  // Mapeia os dados do banco para o formato do estado da aplicação
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
