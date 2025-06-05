
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Tag, Trophy } from "lucide-react";
import { FunnelSelectorDropdown } from "./FunnelSelectorDropdown";
import { CreateFunnelModal } from "./CreateFunnelModal";
import { Funnel } from "@/types/funnel";

interface ModernFunnelControlBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onManageTags: () => void;
  onAddColumn: () => void;
  onAddLead: () => void;
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onSelectFunnel: (funnel: Funnel) => void;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
  isAdmin?: boolean;
}

export function ModernFunnelControlBar({
  activeTab,
  setActiveTab,
  onManageTags,
  onAddColumn,
  onAddLead,
  funnels,
  selectedFunnel,
  onSelectFunnel,
  onCreateFunnel,
  isAdmin = false,
}: ModernFunnelControlBarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateNewFunnel = () => {
    if (isAdmin) {
      setShowCreateModal(true);
    }
  };

  const handleCreateFunnel = async (name: string, description?: string) => {
    await onCreateFunnel(name, description);
    setShowCreateModal(false);
  };

  return (
    <>
      <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
          
          {/* Lado Esquerdo - Seletor e Botão */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Seletor de Funil - apenas quando não estiver na aba de resultados */}
            {activeTab === "funnel" && (
              <div className="flex items-center gap-3">
                <FunnelSelectorDropdown
                  funnels={funnels}
                  selectedFunnel={selectedFunnel}
                  onSelectFunnel={onSelectFunnel}
                  onCreateNewFunnel={handleCreateNewFunnel}
                  isAdmin={isAdmin}
                />
              </div>
            )}

            {/* Botão Ganhos e Perdidos */}
            <Button
              onClick={() => setActiveTab(activeTab === "won-lost" ? "funnel" : "won-lost")}
              className={`rounded-2xl px-6 py-3 h-auto transition-all duration-300 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:scale-105
                ${activeTab === "won-lost"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                  : "bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800"}
              `}
            >
              <Trophy className="w-5 h-5" />
              GANHOS E PERDIDOS
            </Button>
          </div>

          {/* Lado Direito - Ações (apenas no funil principal) */}
          {activeTab === "funnel" && (
            <div className="flex items-center gap-3">
              {/* Botão Gerenciar Tags */}
              <Button
                variant="outline"
                onClick={onManageTags}
                className="bg-white/20 backdrop-blur-lg border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl px-6 py-2.5 h-auto transition-all duration-300 hover:shadow-lg"
              >
                <Tag className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Etiquetas</span>
              </Button>

              {/* Botão Adicionar Lead */}
              <Button
                onClick={onAddLead}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl px-6 py-2.5 h-auto shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Lead</span>
              </Button>

              {/* Botão Adicionar Etapa */}
              <Button
                onClick={onAddColumn}
                className="bg-gradient-to-r from-ticlin to-ticlin-dark hover:from-ticlin-dark hover:to-ticlin text-black rounded-2xl px-6 py-2.5 h-auto shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Etapa</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação de Funil */}
      <CreateFunnelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateFunnel={handleCreateFunnel}
      />
    </>
  );
}
