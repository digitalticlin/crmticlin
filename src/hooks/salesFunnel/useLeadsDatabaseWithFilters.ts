import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDataFilters } from "@/hooks/useDataFilters";
import { toast } from "sonner";
import { salesFunnelLeadsQueryKeys } from "./queryKeys";

/**
 * 🎯 HOOK DE LEADS COM FILTROS CONDICIONAIS
 * - Admin: Vê leads dos funis que criou
 * - Operacional: Vê leads atribuídos a ele (owner_id)
 * - Usa a mesma lógica, apenas com filtros diferentes
 */
export function useLeadsDatabaseWithFilters(funnelId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { role, leadsFilter, loading: filtersLoading } = useDataFilters();

  console.log('[useLeadsDatabaseWithFilters] 🔍 Iniciando com filtros:', { 
    funnelId, 
    userId: user?.id, 
    role, 
    leadsFilter,
    filtersLoading 
  });

  const { data: leads = [], refetch: refetchLeads, isLoading } = useQuery({
    queryKey: ['leads-with-filters', funnelId, user?.id, role], // Query key única
    queryFn: async () => {
      if (!funnelId || !user?.id || filtersLoading || !leadsFilter) {
        console.log('[useLeadsDatabaseWithFilters] ⚠️ Aguardando parâmetros...');
        return [];
      }

      console.log('[useLeadsDatabaseWithFilters] 📊 Executando query com filtros...', { role, leadsFilter });

      try {
        // 🎯 Query base
        let query = supabase
          .from("leads")
          .select(`
            *,
            tags:lead_tags(
              tag:tags(*)
            )
          `)
          .eq("funnel_id", funnelId);

        // 🔒 APLICAR FILTROS CONDICIONAIS
        if (role === 'admin') {
          // Admin: Vê leads dos funis que criou
          query = query.eq("created_by_user_id", leadsFilter.created_by_user_id);
          console.log('[useLeadsDatabaseWithFilters] 👑 Filtro ADMIN aplicado');
          
        } else if (role === 'operational') {
          // Operacional: Vê apenas leads atribuídos a ele
          query = query.eq("owner_id", leadsFilter.owner_id);
          console.log('[useLeadsDatabaseWithFilters] 🎯 Filtro OPERACIONAL aplicado');
        }

        const { data, error } = await query.order("order_position");

        if (error) {
          console.error('[useLeadsDatabaseWithFilters] ❌ Erro na query:', error);
          throw error;
        }

        console.log('[useLeadsDatabaseWithFilters] ✅ Leads carregados:', {
          role,
          count: data?.length || 0,
          sample: data?.slice(0, 2).map(l => ({ 
            id: l.id, 
            name: l.name, 
            owner_id: l.owner_id,
            created_by_user_id: l.created_by_user_id
          }))
        });

        return data || [];
        
      } catch (error) {
        console.error('[useLeadsDatabaseWithFilters] ❌ Erro:', error);
        return [];
      }
    },
    enabled: !!funnelId && !!user?.id && !filtersLoading && !!leadsFilter,
  });

  // 🎯 MUTATIONS - Mantém lógica atual mas com verificação de permissão
  const addTagToLead = useMutation({
    mutationFn: async ({ leadId, tagId }: { leadId: string; tagId: string }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Verificar se tem acesso ao lead
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        throw new Error("Lead não encontrado ou sem permissão");
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
      queryClient.invalidateQueries({ queryKey: ['leads-with-filters'] });
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

      // Verificar se tem acesso ao lead
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        throw new Error("Lead não encontrado ou sem permissão");
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
      queryClient.invalidateQueries({ queryKey: ['leads-with-filters'] });
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

      // Verificar se tem acesso ao lead
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        throw new Error("Lead não encontrado ou sem permissão");
      }

      // Filtro de segurança baseado no role
      let updateQuery = supabase
        .from("leads")
        .update(fields)
        .eq("id", leadId);

      if (role === 'admin') {
        updateQuery = updateQuery.eq("created_by_user_id", user.id);
      } else if (role === 'operational') {
        updateQuery = updateQuery.eq("owner_id", user.id);
      }

      const { error } = await updateQuery;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads-with-filters'] });
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
    updateLead,
    isLoading: isLoading || filtersLoading,
    role,
    hasPermission: !filtersLoading && !!leadsFilter
  };
}