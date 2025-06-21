
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useLeadsDatabase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addTagToLead = useMutation({
    mutationFn: async ({ leadId, tagId }: { leadId: string; tagId: string }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from("lead_tags")
        .insert({
          lead_id: leadId,
          tag_id: tagId,
          created_by_user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast.success("Tag adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar tag:", error);
      toast.error("Erro ao adicionar tag");
    },
  });

  const removeTagFromLead = useMutation({
    mutationFn: async ({ leadId, tagId }: { leadId: string; tagId: string }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from("lead_tags")
        .delete()
        .eq("lead_id", leadId)
        .eq("tag_id", tagId)
        .eq("created_by_user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast.success("Tag removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover tag:", error);
      toast.error("Erro ao remover tag");
    },
  });

  return { addTagToLead, removeTagFromLead };
}
