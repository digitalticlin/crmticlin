
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
      
      // Get the current user's session to check permissions
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");
      
      // Check if user is super admin (can see all instances)
      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
      
      let query;
      
      if (isSuperAdmin) {
        // Super admins can see all WhatsApp numbers
        query = supabase
          .from('whatsapp_numbers')
          .select('*');
      } else {
        // Check if user is company admin (can see all instances within company)
        const { data: isCompanyAdmin } = await supabase.rpc('is_company_admin');
        
        if (isCompanyAdmin) {
          // Company admins can see all WhatsApp numbers for their company
          const { data: userCompanyId } = await supabase.rpc('get_user_company_id');
          
          query = supabase
            .from('whatsapp_numbers')
            .select('*')
            .eq('company_id', userCompanyId);
        } else {
          // Regular users can only see WhatsApp numbers assigned to them
          // Fix: Use correct approach to fetch user's WhatsApp numbers
          const { data: userWhatsappNumbers, error: whatsappError } = await supabase
            .from('user_whatsapp_numbers')
            .select('whatsapp_number_id')
            .eq('profile_id', session.user.id);
            
          if (whatsappError) throw whatsappError;
          
          if (!userWhatsappNumbers || userWhatsappNumbers.length === 0) {
            // No WhatsApp numbers assigned to the user
            setInstances([
              { id: "1", instanceName, connected: false }
            ]);
            return;
          }
          
          // Get the WhatsApp numbers that are assigned to the user
          const whatsappNumberIds = userWhatsappNumbers.map(num => num.whatsapp_number_id);
          
          query = supabase
            .from('whatsapp_numbers')
            .select('*')
            .in('id', whatsappNumberIds);
        }
      }
      
      const { data, error } = await query;

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
