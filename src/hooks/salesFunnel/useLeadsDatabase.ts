
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useLeadsDatabase(funnelId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  console.log('[useLeadsDatabase] 🔍 Iniciando query com:', { funnelId, userId: user?.id });

  const { data: leads = [], refetch: refetchLeads } = useQuery({
    queryKey: ["kanban-leads", funnelId],
    queryFn: async () => {
      if (!funnelId || !user?.id) {
        console.log('[useLeadsDatabase] ⚠️ Faltam parâmetros:', { funnelId, userId: user?.id });
        return [];
      }

      console.log('[useLeadsDatabase] 📊 Executando query para leads...');

      // 🚀 CORREÇÃO EMERGENCIAL: Filtro manual obrigatório (RLS desativado)
      console.log('[useLeadsDatabase] 🔧 PLANO B: Filtro manual ativo');
      
      // 1. Buscar profile do usuário logado
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)  // ✅ ID direto - profiles.id = auth.users.id
        .single();

      if (profileError || !userProfile) {
        console.error('[useLeadsDatabase] ❌ Profile não encontrado:', profileError);
        return [];
      }

      console.log('[useLeadsDatabase] ✅ Profile encontrado:', userProfile);

      // 2. Query com filtro MANUAL obrigatório
      let query = supabase
        .from("leads")
        .select(`
          *,
          tags:lead_tags(
            tag:tags(*)
          )
        `)
        .eq("funnel_id", funnelId)
        .eq("created_by_user_id", userProfile.id);  // 🔒 FILTRO MULTITENANT FORÇADO

      console.log('[useLeadsDatabase] 🔒 Filtro multitenant manual aplicado para profile:', userProfile.id);

      const { data, error } = await query.order("order_position");

      if (error) {
        console.error('[useLeadsDatabase] ❌ Erro na query:', error);
        throw error;
      }

      console.log('[useLeadsDatabase] ✅ Leads carregados:', {
        count: data?.length || 0,
        leadsWithStage: data?.filter(l => l.kanban_stage_id).length || 0,
        leadsWithoutStage: data?.filter(l => !l.kanban_stage_id).length || 0,
        sample: data?.slice(0, 2).map(l => ({ 
          id: l.id, 
          name: l.name, 
          kanban_stage_id: l.kanban_stage_id,
          document_id: l.document_id,
          address: l.address
        }))
      });

      return data || [];
    },
    enabled: !!funnelId && !!user?.id,
  });

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
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
      toast.success("Tag removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover tag:", error);
      toast.error("Erro ao remover tag");
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ leadId, fields }: { leadId: string; fields: Record<string, any> }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { error } = await supabase
        .from("leads")
        .update(fields)
        .eq("id", leadId)
        .eq("created_by_user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-leads"] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar lead:", error);
      toast.error("Erro ao atualizar lead");
    },
  });

  return {
    leads,
    refetchLeads,
    addTagToLead,
    removeTagFromLead,
    updateLead
  };
}
