
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanPhoneNumber, validatePhone } from "@/utils/phoneFormatter";
import { useCompanyData } from "../useCompanyData";

export interface CreateLeadData {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  purchaseValue?: number;
  kanbanStageId: string;
  tags?: string[];
  notes?: string;
}

export const useLeadCreation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { companyId } = useCompanyData();
  const queryClient = useQueryClient();

  const createLeadMutation = useMutation({
    mutationFn: async (data: CreateLeadData) => {
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // CORREÇÃO: Limpar telefone antes de validar
      const cleanPhone = cleanPhoneNumber(data.phone);

      // Validar telefone limpo
      if (!validatePhone(cleanPhone)) {
        throw new Error("Telefone inválido");
      }

      // Verificar se já existe um lead com este telefone limpo
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", cleanPhone) // CORREÇÃO: Usar telefone limpo
        .eq("company_id", companyId)
        .maybeSingle();

      if (existingLead) {
        throw new Error("Já existe um lead com este telefone");
      }

      // Buscar uma instância ativa do WhatsApp da empresa
      const { data: whatsappInstance } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("company_id", companyId)
        .eq("connection_status", "connected")
        .limit(1)
        .maybeSingle();

      if (!whatsappInstance) {
        throw new Error("Nenhuma instância do WhatsApp conectada encontrada");
      }

      // Criar o lead
      const { data: newLead, error } = await supabase
        .from("leads")
        .insert({
          name: data.name,
          phone: cleanPhone, // CORREÇÃO: Salvar telefone limpo
          email: data.email,
          company: data.company,
          address: data.address,
          purchase_value: data.purchaseValue,
          kanban_stage_id: data.kanbanStageId,
          notes: data.notes,
          company_id: companyId,
          whatsapp_number_id: whatsappInstance.id,
          last_message_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Associar tags se fornecidas
      if (data.tags && data.tags.length > 0) {
        const tagInserts = data.tags.map(tagId => ({
          lead_id: newLead.id,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from("lead_tags")
          .insert(tagInserts);

        if (tagError) {
          console.error("Erro ao associar tags:", tagError);
        }
      }

      return newLead;
    },
    onSuccess: (newLead) => {
      toast.success("Lead criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      
      // Enviar mensagem de boas-vindas
      sendWelcomeMessage(newLead.phone, newLead.name);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar lead");
    }
  });

  const sendWelcomeMessage = async (phone: string, name: string) => {
    try {
      // Aqui você pode integrar com o serviço de WhatsApp para enviar mensagem
      // Por enquanto, apenas simular o envio
      const welcomeMessage = `Olá ${name}! Obrigado por entrar em contato conosco. Em breve retornaremos seu contato.`;
      
      console.log(`Enviando mensagem para ${phone}: ${welcomeMessage}`);
      toast.success("Mensagem de boas-vindas enviada!");
      
      // TODO: Implementar envio real via API do WhatsApp
    } catch (error) {
      console.error("Erro ao enviar mensagem de boas-vindas:", error);
      toast.error("Lead criado, mas falha ao enviar mensagem de boas-vindas");
    }
  };

  const createLead = async (data: CreateLeadData) => {
    setIsLoading(true);
    try {
      await createLeadMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createLead,
    isLoading: isLoading || createLeadMutation.isPending,
    error: createLeadMutation.error
  };
};
