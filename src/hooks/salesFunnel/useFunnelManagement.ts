
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  useEffect(() => {
    console.log('[Funnel Management] 🔍 Auth state mudou:', { 
      hasUser: !!user, 
      userId: user?.id, 
      email: user?.email 
    });
    
    if (user) {
      console.log('[Funnel Management] 🔑 Usuário autenticado, carregando funis...', { userId: user.id, email: user.email });
      loadFunnels();
    } else {
      console.log('[Funnel Management] ❌ Usuário não autenticado - limpando dados');
      setFunnels([]);
      setSelectedFunnel(null);
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
      console.log('[Funnel Management] 🔍 Buscando funis do usuário autenticado:', {
        userId: user.id,
        email: user.email
      });

      // Primeiro verificar se o usuário está autenticado no Supabase
      const { data: currentUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('[Funnel Management] ❌ Erro de autenticação:', authError);
        throw new Error('Erro de autenticação: ' + authError.message);
      }
      
      if (!currentUser.user) {
        console.error('[Funnel Management] ❌ Usuário não está autenticado no Supabase');
        throw new Error('Usuário não está autenticado no Supabase');
      }
      
      console.log('[Funnel Management] ✅ Usuário autenticado no Supabase:', {
        supabaseUserId: currentUser.user.id,
        contextUserId: user.id,
        match: currentUser.user.id === user.id
      });
      
      // Buscar funis do usuário usando RLS
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
      
      if (data && data.length > 0 && !selectedFunnel) {
        console.log('[Funnel Management] ✅ Selecionando primeiro funil:', data[0]);
        setSelectedFunnel(data[0]);
      } else if (!data || data.length === 0) {
        console.log('[Funnel Management] ⚠️ Nenhum funil encontrado para este usuário');
        toast.info("Nenhum funil encontrado. Criando funil padrão...");
        
        // Criar funil padrão se não existir
        await createDefaultFunnel();
      }
    } catch (error: any) {
      console.error("[Funnel Management] ❌ Erro ao carregar funis:", error);
      toast.error(`Erro ao carregar funis: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultFunnel = async () => {
    try {
      console.log('[Funnel Management] 🆕 Criando funil padrão para o usuário');
      
      const { data, error } = await supabase
        .from("funnels")
        .insert({ 
          name: "Funil Principal", 
          description: "Funil padrão criado automaticamente",
          created_by_user_id: user!.id
        })
        .select()
        .single();

      if (error) {
        console.error('[Funnel Management] ❌ Erro ao criar funil padrão:', error);
        throw error;
      }

      if (data) {
        console.log('[Funnel Management] ✅ Funil padrão criado:', data);
        setFunnels([data]);
        setSelectedFunnel(data);
        
        await createDefaultStages(data.id);
        toast.success("Funil padrão criado com sucesso!");
      }

      return data;
    } catch (error: any) {
      console.error("[Funnel Management] ❌ Erro ao criar funil padrão:", error);
      toast.error(`Erro ao criar funil padrão: ${error.message}`);
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
          created_by_user_id: user.id
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
        
        await createDefaultStages(data.id);
        toast.success(`Funil "${name}" criado com sucesso!`);
      }

      return data;
    } catch (error: any) {
      console.error("[Funnel Management] ❌ Erro ao criar funil:", error);
      toast.error(`Erro ao criar funil: ${error.message}`);
      throw error;
    }
  };

  const createDefaultStages = async (funnelId: string) => {
    if (!user) return;

    const defaultStages = [
      { title: "Entrada de Leads", color: "#3b82f6", order_position: 1, is_fixed: true },
      { title: "Em atendimento", color: "#8b5cf6", order_position: 2 },
      { title: "Em negociação", color: "#f59e0b", order_position: 3 },
      { title: "GANHO", color: "#10b981", order_position: 4, is_won: true, is_fixed: true },
      { title: "PERDIDO", color: "#6b7280", order_position: 5, is_lost: true, is_fixed: true }
    ];

    try {
      const stages = defaultStages.map(stage => ({
        ...stage,
        funnel_id: funnelId,
        created_by_user_id: user.id,
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
      toast.error(`Erro ao criar estágios: ${error.message}`);
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
      toast.error(`Erro ao atualizar funil: ${error.message}`);
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
      toast.error(`Erro ao deletar funil: ${error.message}`);
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
