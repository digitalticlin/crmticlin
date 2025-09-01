
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export function useTagDatabase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags", user?.id],
    queryFn: async (): Promise<Tag[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("created_by_user_id", user.id)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("tags")
        .insert({
          name,
          color,
          created_by_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar tag:", error);
      toast.error("Erro ao criar tag");
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from("tags")
        .update({ name, color, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("created_by_user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar tag:", error);
      toast.error("Erro ao atualizar tag");
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (tagId: string) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // First remove all lead_tags associations
      await supabase
        .from("lead_tags")
        .delete()
        .eq("tag_id", tagId)
        .eq("created_by_user_id", user.id);

      // Then delete the tag
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId)
        .eq("created_by_user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      // TEMPORÁRIO: Removido invalidateQueries de leads para evitar loop infinito
      toast.success("Tag removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover tag:", error);
      toast.error("Erro ao remover tag");
    },
  });

  return {
    tags,
    isLoading,
    createTag,
    updateTag,
    deleteTag,
  };
}
