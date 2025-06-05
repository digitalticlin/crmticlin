
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Tag, ArrowLeft } from "lucide-react";
import { FunnelSelectorDropdown } from "./FunnelSelectorDropdown";
import { CreateFunnelModal } from "./CreateFunnelModal";
import { WonLostFilters } from "./WonLostFilters";
import { Funnel } from "@/types/funnel";
import { KanbanTag } from "@/types/kanban";

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
  // Props para filtros de Ganhos e Perdidos
  wonLostFilters?: {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedTags: string[];
    setSelectedTags: (tags: string[]) => void;
    selectedUser: string;
    setSelectedUser: (user: string) => void;
    availableTags: KanbanTag[];
    availableUsers: string[];
    onClearFilters: () => void;
    resultsCount: number;
  };
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
  wonLostFilters,
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
      <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-3xl p-4 shadow-2xl">
        <div className="flex flex-col gap-3">
          
          {/* Linha principal - Todos os controles */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
            
            {/* Lado Esquerdo - Seletor, Botão e Filtros */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 flex-1">
              {/* Seletor de Funil e Botão Ganhos/Perdidos */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Seletor de Funil - apenas quando não estiver na aba de resultados */}
                {activeTab === "funnel" && (
                  <FunnelSelectorDropdown
                    funnels={funnels}
                    selectedFunnel={selectedFunnel}
                    onSelectFunnel={onSelectFunnel}
                    onCreateNewFunnel={handleCreateNewFunnel}
                    isAdmin={isAdmin}
                  />
                )}

                {/* Botão Ganhos e Perdidos / Voltar ao Funil */}
                <Button
                  onClick={() => setActiveTab(activeTab === "won-lost" ? "funnel" : "won-lost")}
                  className={`rounded-2xl px-4 py-2 h-auto transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105
                    ${activeTab === "won-lost"
                      ? "bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800"
                      : "bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800"}
                  `}
                >
                  {activeTab === "won-lost" ? (
                    <>
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Voltar ao funil</span>
                    </>
                  ) : (
                    "GANHOS E PERDIDOS"
                  )}
                </Button>
              </div>

              {/* Filtros na mesma linha - apenas na aba Ganhos e Perdidos */}
              {activeTab === "won-lost" && wonLostFilters && (
                <div className="flex-1 min-w-0">
                  <WonLostFilters
                    searchTerm={wonLostFilters.searchTerm}
                    setSearchTerm={wonLostFilters.setSearchTerm}
                    selectedTags={wonLostFilters.selectedTags}
                    setSelectedTags={wonLostFilters.setSelectedTags}
                    selectedUser={wonLostFilters.selectedUser}
                    setSelectedUser={wonLostFilters.setSelectedUser}
                    availableTags={wonLostFilters.availableTags}
                    availableUsers={wonLostFilters.availableUsers}
                    onClearFilters={wonLostFilters.onClearFilters}
                    resultsCount={wonLostFilters.resultsCount}
                  />
                </div>
              )}
            </div>

            {/* Lado Direito - Ações (apenas no funil principal) */}
            {activeTab === "funnel" && (
              <div className="flex items-center gap-2">
                {/* Botão Gerenciar Tags */}
                <Button
                  variant="outline"
                  onClick={onManageTags}
                  className="bg-white/20 backdrop-blur-lg border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl px-4 py-2 h-auto transition-all duration-300 hover:shadow-lg"
                >
                  <Tag className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Etiquetas</span>
                </Button>

                {/* Botão Adicionar Lead */}
                <Button
                  onClick={onAddLead}
                  className="bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl px-4 py-2 h-auto shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Lead</span>
                </Button>

                {/* Botão Adicionar Etapa */}
                <Button
                  onClick={onAddColumn}
                  className="bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl px-4 py-2 h-auto shadow-lg transition-all duration-300 hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Etapa</span>
                </Button>
              </div>
            )}
          </div>
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
