
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthSession } from "../useAuthSession";

export const useDefaultFunnelSetup = () => {
  const { user } = useAuthSession();

  useEffect(() => {
    const setupDefaultFunnel = async () => {
      if (!user) return;

      try {
        // Verificar se o usuário já tem um funil
        const { data: existingFunnels, error: funnelError } = await supabase
          .from("funnels")
          .select("id")
          .eq("created_by_user_id", user.id)
          .limit(1);

        if (funnelError) {
          console.error("Erro ao verificar funis existentes:", funnelError);
          return;
        }

        // Se já tem funil, não fazer nada
        if (existingFunnels && existingFunnels.length > 0) {
          console.log("Usuário já possui funil configurado");
          return;
        }

        // Criar funil principal
        const { data: newFunnel, error: createFunnelError } = await supabase
          .from("funnels")
          .insert({
            name: "Funil Principal",
            description: "Funil padrão criado automaticamente",
            company_id: null,
            created_by_user_id: user.id
          })
          .select()
          .single();

        if (createFunnelError) {
          console.error("Erro ao criar funil:", createFunnelError);
          toast.error("Erro ao criar funil padrão");
          return;
        }

        if (!newFunnel) {
          console.error("Funil não foi criado");
          return;
        }

        // Criar etapas padrão do funil com as cores especificadas
        const defaultStages = [
          { title: "Entrada de Leads", color: "#3b82f6", order_position: 1, is_won: false, is_lost: false, is_fixed: true },
          { title: "Em atendimento", color: "#8b5cf6", order_position: 2, is_won: false, is_lost: false, is_fixed: false },
          { title: "Em negociação", color: "#f97316", order_position: 3, is_won: false, is_lost: false, is_fixed: false },
          { title: "Ganho", color: "#10b981", order_position: 4, is_won: true, is_lost: false, is_fixed: true },
          { title: "Perdido", color: "#6b7280", order_position: 5, is_won: false, is_lost: true, is_fixed: true }
        ];

        const stages = defaultStages.map(stage => ({
          ...stage,
          funnel_id: newFunnel.id,
          company_id: null,
          created_by_user_id: user.id
        }));

        const { error: stagesError } = await supabase
          .from("kanban_stages")
          .insert(stages);

        if (stagesError) {
          console.error("Erro ao criar etapas:", stagesError);
          toast.error("Erro ao criar etapas do funil");
          return;
        }

        console.log("Funil Principal criado com sucesso:", newFunnel.id);
        toast.success("Funil Principal criado com sucesso!");

      } catch (error) {
        console.error("Erro ao configurar funil padrão:", error);
        toast.error("Erro ao configurar funil padrão");
      }
    };

    setupDefaultFunnel();
  }, [user]);

  return null;
};
