
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthSession } from "../useAuthSession";

export interface Funnel {
  id: string;
  name: string;
  description?: string;
  created_by_user_id: string;
  created_at?: string;
}

export function useFunnelManagement() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuthSession();

  useEffect(() => {
    if (user) {
      console.log('[Funnel Management] 🚀 Usuário logado, carregando funis...', { userId: user.id, email: user.email });
      loadFunnels();
    } else {
      console.log('[Funnel Management] ❌ Usuário não autenticado');
    }
    // eslint-disable-next-line
  }, [user]);

  const loadFunnels = async () => {
    if (!user) {
      console.log('[Funnel Management] ❌ Não há usuário para carregar funis');
      return;
    }
    
    setLoading(true);
    try {
      console.log('[Funnel Management] 🔍 Buscando funis para usuário:', { userId: user.id, email: user.email });
      
      const { data, error } = await supabase
        .from("funnels")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error('[Funnel Management] ❌ Erro na query:', error);
        throw error;
      }

      console.log('[Funnel Management] 📊 Funis encontrados:', { 
        foundFunnels: data?.length || 0, 
        funnels: data 
      });

      setFunnels(data || []);
      
      // Se não há funil selecionado e existem funis, selecionar o primeiro
      if (data && data.length > 0 && !selectedFunnel) {
        console.log('[Funnel Management] ✅ Selecionando primeiro funil:', data[0]);
        setSelectedFunnel(data[0]);
      } else if (!data || data.length === 0) {
        console.log('[Funnel Management] ⚠️ Nenhum funil encontrado, tentando criar funil padrão...');
        
        // Tentar criar um funil padrão se não existir nenhum
        try {
          await createFunnel("Funil Principal", "Funil padrão criado automaticamente");
        } catch (createError) {
          console.error('[Funnel Management] ❌ Erro ao criar funil padrão:', createError);
          toast.error("Erro ao criar funil padrão. Verifique suas permissões.");
        }
      }
    } catch (error: any) {
      console.error("[Funnel Management] ❌ Erro ao carregar funis:", error);
      
      // Tratamento específico para erros de RLS
      if (error.message?.includes('row-level security') || error.message?.includes('infinite recursion')) {
        console.error("[Funnel Management] 🔒 Erro de RLS detectado:", error.message);
        toast.error("Erro de permissão ao carregar funis. As políticas RLS foram atualizadas, tente recarregar a página.");
      } else {
        toast.error(`Erro ao carregar funis: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const createFunnel = async (name: string, description?: string) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      console.log('[Funnel Management] 📝 Criando novo funil:', { name, description, userId: user.id });
      
      const { data, error } = await supabase
        .from("funnels")
        .insert({ 
          name, 
          description,
          created_by_user_id: user.id,
          company_id: null
        })
        .select()
        .single();

      if (error) {
        console.error('[Funnel Management] ❌ Erro ao criar funil:', error);
        throw error;
      }

      if (data) {
        console.log('[Funnel Management] ✅ Funil criado:', data);
        setFunnels((prev) => [...prev, data]);
        setSelectedFunnel(data);
        
        // Criar estágios padrão para o novo funil
        await createDefaultStages(data.id);
        toast.success(`Funil "${name}" criado com sucesso!`);
      }

      return data;
    } catch (error: any) {
      console.error("[Funnel Management] ❌ Erro ao criar funil:", error);
      
      if (error.message?.includes('row-level security')) {
        toast.error("Erro de permissão ao criar funil. Verifique se você tem permissões de admin.");
      } else {
        toast.error(`Erro ao criar funil: ${error.message}`);
      }
      throw error;
    }
  };

  const createDefaultStages = async (funnelId: string) => {
    if (!user) return;

    const defaultStages = [
      { title: "ENTRADA DE LEAD", color: "#3b82f6", order_position: 1 },
      { title: "QUALIFICAÇÃO", color: "#8b5cf6", order_position: 2 },
      { title: "PROPOSTA", color: "#f59e0b", order_position: 3 },
      { title: "NEGOCIAÇÃO", color: "#ef4444", order_position: 4 },
      { title: "GANHO", color: "#10b981", order_position: 5, is_won: true, is_fixed: true },
      { title: "PERDIDO", color: "#6b7280", order_position: 6, is_lost: true, is_fixed: true }
    ];

    try {
      const stages = defaultStages.map(stage => ({
        ...stage,
        funnel_id: funnelId,
        created_by_user_id: user.id,
        company_id: null,
        is_won: stage.is_won || false,
        is_lost: stage.is_lost || false,
        is_fixed: stage.is_fixed || false
      }));

      const { error } = await supabase
        .from("kanban_stages")
        .insert(stages);

      if (error) {
        console.error('[Funnel Management] ❌ Erro ao criar estágios:', error);
        throw error;
      }
      
      console.log('[Funnel Management] ✅ Estágios padrão criados para funil:', funnelId);
    } catch (error: any) {
      console.error("[Funnel Management] ❌ Erro ao criar estágios padrão:", error);
      
      if (error.message?.includes('row-level security')) {
        toast.error("Erro de permissão ao criar estágios");
      } else {
        toast.error(`Erro ao criar estágios: ${error.message}`);
      }
      throw error;
    }
  };

  const updateFunnel = async (funnelId: string, updates: Partial<Funnel>) => {
    try {
      console.log('[Funnel Management] 📝 Atualizando funil:', { funnelId, updates });
      
      const { data, error } = await supabase
        .from("funnels")
        .update(updates)
        .eq("id", funnelId)
        .select()
        .single();

      if (error) {
        console.error('[Funnel Management] ❌ Erro ao atualizar funil:', error);
        throw error;
      }

      if (data) {
        console.log('[Funnel Management] ✅ Funil atualizado:', data);
        setFunnels((prev) => 
          prev.map((funnel) => 
            funnel.id === funnelId ? { ...funnel, ...data } : funnel
          )
        );
        
        if (selectedFunnel?.id === funnelId) {
          setSelectedFunnel({ ...selectedFunnel, ...data });
        }
        
        toast.success("Funil atualizado com sucesso!");
      }

      return data;
    } catch (error: any) {
      console.error("Erro ao atualizar funil:", error);
      
      if (error.message?.includes('row-level security')) {
        toast.error("Erro de permissão ao atualizar funil");
      } else {
        toast.error(`Erro ao atualizar funil: ${error.message}`);
      }
      throw error;
    }
  };

  const deleteFunnel = async (funnelId: string) => {
    try {
      console.log('[Funnel Management] 🗑️ Deletando funil:', funnelId);
      
      const { error } = await supabase
        .from("funnels")
        .delete()
        .eq("id", funnelId);

      if (error) {
        console.error('[Funnel Management] ❌ Erro ao deletar funil:', error);
        throw error;
      }

      console.log('[Funnel Management] ✅ Funil deletado com sucesso');
      setFunnels((prev) => prev.filter((funnel) => funnel.id !== funnelId));
      
      if (selectedFunnel?.id === funnelId) {
        const remainingFunnels = funnels.filter((funnel) => funnel.id !== funnelId);
        setSelectedFunnel(remainingFunnels.length > 0 ? remainingFunnels[0] : null);
      }
      
      toast.success("Funil deletado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao deletar funil:", error);
      
      if (error.message?.includes('row-level security')) {
        toast.error("Erro de permissão ao deletar funil");
      } else {
        toast.error(`Erro ao deletar funil: ${error.message}`);
      }
      throw error;
    }
  };

  return { 
    funnels, 
    selectedFunnel, 
    setSelectedFunnel, 
    loading, 
    createFunnel, 
    updateFunnel,
    deleteFunnel,
    loadFunnels 
  };
}
