
import { FunnelTabButton } from "./controls/FunnelTabButton";
import { WonLostTabButton } from "./controls/WonLostTabButton";
import { FunnelActionButtons } from "./controls/FunnelActionButtons";
import { WonLostFilters } from "./WonLostFilters";
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
  return (
    <div className="flex items-center justify-between w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-glass">
      {/* Lado Esquerdo - Tabs com Funnel Selector integrado */}
      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/20">
        {/* Tab Funil de Vendas com Dropdown */}
        <FunnelTabButton
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          funnels={funnels}
          selectedFunnel={selectedFunnel}
          onSelectFunnel={onSelectFunnel}
          onCreateFunnel={onCreateFunnel}
          isAdmin={isAdmin}
        />

        {/* Tab Ganhos e Perdidos */}
        <WonLostTabButton
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Lado Direito - Botões de Ação */}
      <div className="flex items-center gap-3">
        {activeTab === "funnel" && (
          <FunnelActionButtons isAdmin={isAdmin} />
        )}

        {activeTab === "won-lost" && wonLostFilters && (
          <WonLostFilters {...wonLostFilters} />
        )}
      </div>
    </div>
  );
};
