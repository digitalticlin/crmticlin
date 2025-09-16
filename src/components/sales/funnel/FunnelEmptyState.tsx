
import { PageLayout } from "@/components/layout/PageLayout";
import { TrendingUp, Plus } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const FunnelEmptyState = () => {
  const { isAdmin } = useUserRole();
  const { user } = useAuth();

  const createFunnel = async (name: string, description?: string) => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      const { error } = await supabase
        .from('funnels')
        .insert([{
          name,
          description,
          created_by_user_id: user.id
        }]);

      if (error) throw error;
      toast.success("Funil criado com sucesso!");
      window.location.reload(); // Recarregar para mostrar o novo funil
    } catch (error: any) {
      console.error('Erro ao criar funil:', error);
      toast.error(error.message || "Erro ao criar funil");
    }
  };

  const handleCreateFunnel = () => {
    createFunnel("Funil Principal", "Funil principal de vendas");
  };

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-12 shadow-glass-lg max-w-lg w-full text-center animate-scale-in">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-ticlin/20 to-ticlin/40 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
              <TrendingUp className="w-12 h-12 text-ticlin" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Ops! Nenhum funil encontrado
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              {isAdmin 
                ? "Que tal começarmos criando seu primeiro funil de vendas? É rápido e fácil!" 
                : "Parece que ainda não há funis disponíveis para você. Entre em contato com seu administrador."
              }
            </p>
          </div>
          
          {isAdmin && (
            <button
              onClick={handleCreateFunnel}
              className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black font-bold py-4 px-8 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center gap-3 mx-auto group"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              Criar Primeiro Funil
            </button>
          )}
          
          {!isAdmin && (
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-amber-800 font-medium">
                💡 Dica: Entre em contato com seu administrador para configurar os funis de vendas
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
