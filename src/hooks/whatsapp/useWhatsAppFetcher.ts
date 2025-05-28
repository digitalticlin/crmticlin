
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
        .from('whatsapp_instances')
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
    
    // Gera o nome do prefixo da instância com base no email (parte antes do @)
    const instancePrefix = userEmail
      ? userEmail.split('@')[0].replace(/[^a-z0-9]/gi, "").toLowerCase()
      : "";

    try {
      console.log(`Buscando instâncias WhatsApp para usuário: ${userEmail}, prefixo: ${instancePrefix}`);
      fetchingRef.current[userEmail] = true;
      setError(null);

      // Busca todas as instâncias do usuário cujo instance_name começa com o prefixo
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .ilike('instance_name', `${instancePrefix}%`); // ilike é case-insensitive

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`Encontradas ${data.length} instâncias WhatsApp para usuário ${userEmail} (prefixo: ${instancePrefix})`);
        const mappedInstances = mapDatabaseInstancesToState(data);
        setInstances(mappedInstances);
      } else {
        console.log(`Nenhuma instância WhatsApp encontrada para usuário ${userEmail}, criando placeholder`);
        // Se não encontrar instâncias, crie um placeholder
        setInstances([
          { 
            id: "1", 
            instanceName: instancePrefix, 
            connected: false,
            phone: "",
            connection_status: "disconnected"
          }
        ]);
      }
    } catch (error) {
      console.error(`Erro ao buscar instâncias WhatsApp para ${userEmail}:`, error);
      setError("Erro ao carregar instâncias WhatsApp");
      toast.error("Erro ao carregar instâncias WhatsApp");
      setInstances([
        { 
          id: "1", 
          instanceName: instancePrefix, 
          connected: false,
          phone: "",
          connection_status: "disconnected"
        }
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
        connected: instance.connection_status === 'open', // Usar connection_status para mapear connected
        qrCodeUrl: instance.qr_code,
        phoneNumber: instance.phone,
        // Novos campos da tabela
        evolution_instance_name: instance.evolution_instance_name,
        evolution_instance_id: instance.evolution_instance_id,
        phone: instance.phone || "",
        connection_status: instance.connection_status || "disconnected", // Usar connection_status
        owner_jid: instance.owner_jid,
        profile_name: instance.profile_name,
        profile_pic_url: instance.profile_pic_url,
        client_name: instance.client_name,
        date_connected: instance.date_connected,
        date_disconnected: instance.date_disconnected,
        created_at: instance.created_at,
        updated_at: instance.updated_at
      }));
  };

  return {
    fetchInstances,
    fetchUserInstances,
  };
};
