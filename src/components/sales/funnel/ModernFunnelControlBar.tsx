import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Tag, 
  UserPlus, 
  Search, 
  X, 
  Filter,
  ChevronDown
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
  onAddColumn,
  onManageTags,
  onAddLead,
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
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab("funnel")}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === "funnel"
              ? "bg-white text-gray-900 shadow-lg"
              : "text-gray-700 hover:text-gray-900 hover:bg-white/20"
          }`}
        >
          Funil de Vendas
        </button>
        <button
          onClick={() => setActiveTab("won-lost")}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeTab === "won-lost"
              ? "bg-white text-gray-900 shadow-lg"
              : "text-gray-700 hover:text-gray-900 hover:bg-white/20"
          }`}
        >
          Ganhos e Perdidos
        </button>
      </div>

      {/* Barra de Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Seletor de Funil */}
          <FunnelSelector
            funnels={funnels}
            selectedFunnel={selectedFunnel}
            onSelectFunnel={onSelectFunnel}
            onCreateFunnel={onCreateFunnel}
            isAdmin={isAdmin}
          />
        </div>

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

              {/* Botão de Configurações do Funil (Engrenagem) */}
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
      </div>

      {/* Modais */}
      <TagManagementModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
      />

      <CreateLeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        stages={selectedFunnel ? [] : []} // Passar as stages do contexto
      />

      <FunnelConfigModal
        isOpen={isFunnelConfigOpen}
        onClose={() => setIsFunnelConfigOpen(false)}
      />
    </div>
  );
};
