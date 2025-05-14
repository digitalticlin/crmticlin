import { useState, useRef } from "react";
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
export const useWhatsAppFetcher = () => {
  const { setInstances } = useWhatsAppInstanceState();
  const { setError } = useWhatsAppInstanceActions();
  const fetchingRef = useRef<Record<string, boolean>>({});
  
  // Fetch instances from the database for a specific company
  const fetchInstances = async (companyId: string) => {
    // Evitar múltiplas chamadas simultâneas para o mesmo companyId
    if (fetchingRef.current[companyId]) {
      console.log(`Already fetching instances for company ${companyId}, skipping redundant call`);
      return [];
    }
    
    try {
      console.log(`Fetching WhatsApp instances for company: ${companyId}`);
      fetchingRef.current[companyId] = true;
      setError(null);
      
      // Fetch instances from Supabase
      const { data, error } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('company_id', companyId);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`Found ${data.length} WhatsApp instances for company ${companyId}`);
        const mappedInstances = mapDatabaseInstancesToState(data);
        setInstances(mappedInstances);
        return mappedInstances;
      } else {
        console.log(`No WhatsApp instances found for company ${companyId}`);
        setInstances([]);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching WhatsApp instances for company ${companyId}:`, error);
      setError("Error loading WhatsApp instances");
      toast.error("Error loading WhatsApp instances");
      return [];
    } finally {
      fetchingRef.current[companyId] = false;
    }
  };

  // Busca as instâncias do usuário no banco de dados
  const fetchUserInstances = async (userEmail: string) => {
    if (!userEmail) {
      console.log("User email is empty, skipping fetch");
      return;
    }
    
    // Evitar múltiplas chamadas para o mesmo usuário
    if (fetchingRef.current[userEmail]) {
      console.log(`Already fetching instances for user ${userEmail}, skipping redundant call`);
      return;
    }
    
    // Gera o nome da instância com base no email (parte antes do @)
    const instanceName = userEmail ? userEmail.split('@')[0] : "";
    
    try {
      console.log(`Buscando instâncias WhatsApp para usuário: ${userEmail}, nome base da instância: ${instanceName}`);
      fetchingRef.current[userEmail] = true;
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
    } finally {
      fetchingRef.current[userEmail] = false;
    }
  };

  // Mapeia os dados do banco para o formato do estado da aplicação
  const mapDatabaseInstancesToState = (data: any[]): WhatsAppInstance[] => {
    return data
      .filter(instance => instance && instance.id !== "1") // Remove qualquer resquício de placeholder
      .map(instance => ({
        id: instance.id,
        instanceName: instance.instance_name,
        connected: instance.status === 'connected',
        qrCodeUrl: instance.qr_code,
        phoneNumber: instance.phone
      }));
  };

  return {
    fetchInstances,
    fetchUserInstances,
  };
};
