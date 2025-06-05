
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Tag, Settings, Filter, Kanban, Trophy } from "lucide-react";
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
          
          {/* Lado Esquerdo - Seletor e Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Seletor de Funil */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ticlin/20 rounded-xl">
                <Kanban className="w-5 h-5 text-ticlin-dark" />
              </div>
              <FunnelSelectorDropdown
                funnels={funnels}
                selectedFunnel={selectedFunnel}
                onSelectFunnel={onSelectFunnel}
                onCreateNewFunnel={handleCreateNewFunnel}
                isAdmin={isAdmin}
              />
            </div>

            {/* Tabs Modernos */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl p-1 h-12">
                <TabsTrigger
                  value="funnel"
                  className={`px-6 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2
                    ${activeTab === "funnel"
                      ? "bg-white/80 text-gray-800 shadow-lg"
                      : "text-gray-600 hover:bg-white/20 hover:text-gray-800"}
                  `}
                >
                  <Filter className="w-4 h-4" />
                  Funil Principal
                </TabsTrigger>
                <TabsTrigger
                  value="won-lost"
                  className={`px-6 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2
                    ${activeTab === "won-lost"
                      ? "bg-white/80 text-gray-800 shadow-lg"
                      : "text-gray-600 hover:bg-white/20 hover:text-gray-800"}
                  `}
                >
                  <Trophy className="w-4 h-4" />
                  Resultados
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Lado Direito - Ações */}
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
