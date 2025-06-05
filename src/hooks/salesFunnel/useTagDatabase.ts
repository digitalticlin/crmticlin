
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KanbanTag } from "@/types/kanban";

export function useTagDatabase(companyId?: string) {
  const queryClient = useQueryClient();

  // Buscar todas as tags da empresa
  const tagsQuery = useQuery({
    queryKey: ["tags", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("company_id", companyId)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Criar tag
  const createTagMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!companyId) throw new Error("Company ID required");
      const { data, error } = await supabase
        .from("tags")
        .insert({ name, color, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", companyId] });
    },
  });

  // Atualizar tag
  const updateTagMutation = useMutation({
    mutationFn: async ({ tagId, name, color }: { tagId: string; name: string; color: string }) => {
      const { data, error } = await supabase
        .from("tags")
        .update({ name, color })
        .eq("id", tagId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", companyId] });
    },
  });

  // Deletar tag
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", companyId] });
    },
  });

  return {
    tags: tagsQuery.data ?? [],
    loading: tagsQuery.isLoading,
    isLoading: tagsQuery.isLoading,
    createTag: (name: string, color: string) => createTagMutation.mutateAsync({ name, color }),
    updateTag: (tagId: string, name: string, color: string) => updateTagMutation.mutateAsync({ tagId, name, color }),
    deleteTag: deleteTagMutation.mutateAsync,
    loadTags: tagsQuery.refetch,
  };
}
