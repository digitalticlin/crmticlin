
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Tag, 
  UserPlus
} from "lucide-react";
import { FunnelSelector } from "./FunnelSelector";
import { WonLostFilters } from "./WonLostFilters";
import { TagManagementModal } from "./modals/TagManagementModal";
import { CreateLeadModal } from "./modals/CreateLeadModal";
import { FunnelConfigModal } from "./modals/FunnelConfigModal";
import { Funnel } from "@/types/funnel";

interface ModernFunnelControlBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddColumn: () => void;
  onManageTags: () => void;
  onAddLead: () => void;
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onSelectFunnel: (funnel: Funnel) => void;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
  isAdmin: boolean;
  wonLostFilters?: {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedTags: string[];
    setSelectedTags: (tags: string[]) => void;
    selectedUser: string;
    setSelectedUser: (user: string) => void;
    availableTags: any[];
    availableUsers: string[];
    onClearFilters: () => void;
    resultsCount: number;
  };
}

export const ModernFunnelControlBar = ({
  activeTab,
  setActiveTab,
  funnels,
  selectedFunnel,
  onSelectFunnel,
  onCreateFunnel,
  isAdmin,
  wonLostFilters
}: ModernFunnelControlBarProps) => {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isFunnelConfigOpen, setIsFunnelConfigOpen] = useState(false);

  return (
    <div className="flex items-center justify-between w-full bg-white/5 rounded-2xl border border-white/10 p-4">
      {/* Lado Esquerdo - Tabs */}
      <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("funnel")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === "funnel"
              ? "bg-white text-gray-900 shadow-lg"
              : "text-gray-700 hover:text-gray-900 hover:bg-white/20"
          }`}
        >
          Funil de Vendas
        </button>
        <button
          onClick={() => setActiveTab("won-lost")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === "won-lost"
              ? "bg-white text-gray-900 shadow-lg"
              : "text-gray-700 hover:text-gray-900 hover:bg-white/20"
          }`}
        >
          Ganhos e Perdidos
        </button>
      </div>

      {/* Centro - Seletor de Funil */}
      <div className="flex-1 flex justify-center">
        <FunnelSelector
          funnels={funnels}
          selectedFunnel={selectedFunnel}
          onSelectFunnel={onSelectFunnel}
          onCreateFunnel={onCreateFunnel}
          isAdmin={isAdmin}
        />
      </div>

      {/* Lado Direito - Botões de Ação */}
      <div className="flex items-center gap-2">
        {activeTab === "funnel" && (
          <>
            {/* Botão de Etiquetas */}
            <Button
              onClick={() => setIsTagModalOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-gray-700 hover:text-gray-900"
            >
              <Tag className="w-4 h-4 mr-2" />
              Etiquetas
            </Button>

            {/* Botão de Adicionar Lead */}
            <Button
              onClick={() => setIsLeadModalOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-gray-700 hover:text-gray-900"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Lead
            </Button>

            {/* Botão de Configurações do Funil */}
            {isAdmin && (
              <Button
                onClick={() => setIsFunnelConfigOpen(true)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-gray-700 hover:text-gray-900"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </>
        )}

        {activeTab === "won-lost" && wonLostFilters && (
          <WonLostFilters {...wonLostFilters} />
        )}
      </div>

      {/* Modais */}
      <TagManagementModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
      />

      <CreateLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
      />

      <FunnelConfigModal
        isOpen={isFunnelConfigOpen}
        onClose={() => setIsFunnelConfigOpen(false)}
      />
    </div>
  );
};
