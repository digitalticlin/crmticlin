
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "./types";
import { toast } from "sonner";

export function useCreateClientMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      const { data: insertData, error } = await supabase
        .from("leads")
        .insert({
          ...data,
          company_id: companyId,
        })
        .select()
        .single();

      if (error) throw error;
      return insertData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar cliente:", error);
      toast.error("Erro ao criar cliente");
    },
  });
}

export function useUpdateClientMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      const { data: updateData, error } = await supabase
        .from("leads")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar cliente");
    },
  });
}

export function useDeleteClientMutation(companyId: string) {
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
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      toast.success("Cliente removido com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover cliente:", error);
      toast.error("Erro ao remover cliente");
    },
  });
}
