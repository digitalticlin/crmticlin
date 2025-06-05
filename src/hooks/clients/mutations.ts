
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanPhoneNumber, validatePhone } from "@/utils/phoneFormatter";
import { ClientFormData } from "./types";

export const useCreateClientMutation = (companyId: string | null, defaultWhatsAppInstanceId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: ClientFormData) => {
      if (!companyId) {
        throw new Error("Company ID não encontrado");
      }

      if (!defaultWhatsAppInstanceId) {
        throw new Error("Nenhuma instância WhatsApp encontrada. Configure uma instância WhatsApp primeiro.");
      }

      // Limpar e validar telefone
      const cleanPhone = cleanPhoneNumber(clientData.phone);
      if (!validatePhone(cleanPhone)) {
        throw new Error("Telefone inválido");
      }

      // Verificar se já existe um cliente com este telefone
      const { data: existingClient } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", cleanPhone)
        .eq("company_id", companyId)
        .maybeSingle();

      if (existingClient) {
        throw new Error("Já existe um cliente com este telefone");
      }

      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: clientData.name,
          phone: cleanPhone,
          email: clientData.email,
          address: clientData.address,
          company: clientData.company,
          notes: clientData.notes,
          purchase_value: clientData.purchase_value,
          company_id: companyId,
          whatsapp_number_id: defaultWhatsAppInstanceId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Cliente criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar cliente");
    },
  });
};

export const useUpdateClientMutation = (companyId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      const updateData: any = { ...data };
      
      // Se estiver atualizando o telefone, limpar e validar
      if (data.phone) {
        const cleanPhone = cleanPhoneNumber(data.phone);
        if (!validatePhone(cleanPhone)) {
          throw new Error("Telefone inválido");
        }
        updateData.phone = cleanPhone;
      }

      const { data: updatedData, error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });
};

export const useDeleteClientMutation = (companyId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente deletado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao deletar cliente");
    },
  });
};
