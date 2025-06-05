
import { PageLayout } from "@/components/layout/PageLayout";

interface FunnelEmptyStateProps {
  isAdmin: boolean;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
}

export const FunnelEmptyState = ({ isAdmin, onCreateFunnel }: FunnelEmptyStateProps) => {
  const handleCreateFunnel = () => {
    onCreateFunnel("Funil Principal", "Funil principal de vendas");
  };

  return (
    <PageLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-12 shadow-2xl max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-ticlin/20 to-ticlin/40 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-ticlin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Nenhum Funil Encontrado</h3>
            <p className="text-gray-600 mb-6">
              {isAdmin ? "Crie seu primeiro funil para começar a gerenciar leads" : "Nenhum funil disponível para você"}
            </p>
          </div>
          
          {isAdmin && (
            <button
              onClick={handleCreateFunnel}
              className="bg-gradient-to-r from-ticlin to-ticlin-dark text-black font-semibold py-3 px-6 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Criar Primeiro Funil
            </button>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
