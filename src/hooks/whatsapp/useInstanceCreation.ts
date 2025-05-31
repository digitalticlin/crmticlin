
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";
import { toast } from "sonner";
import { WhatsAppWebInstance } from "./useWhatsAppWebInstances";

export const useInstanceCreation = (companyId?: string) => {
  const [isCreating, setIsCreating] = useState(false);

  const createInstance = async (instanceName: string): Promise<WhatsAppWebInstance | null> => {
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    try {
      setIsCreating(true);
      
      console.log('Creating instance with WhatsAppWebService:', instanceName);
      const result = await WhatsAppWebService.createInstance(instanceName);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create instance');
      }

      console.log('Instance creation result:', result);
      
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar a instância recém-criada do banco
      const { data: updatedInstances, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('company_id', companyId)
        .eq('instance_name', instanceName)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching created instance:', fetchError);
        throw new Error(fetchError.message);
      }

      const newInstance = updatedInstances?.[0];
      console.log('Found created instance:', newInstance);
      
      return newInstance || null;
      
    } catch (err) {
      console.error('Error creating instance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar instância';
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createInstance,
    isCreating
  };
};
