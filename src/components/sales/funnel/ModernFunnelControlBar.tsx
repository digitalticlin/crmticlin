
import { FunnelTabButton } from "./controls/FunnelTabButton";
import { WonLostTabButton } from "./controls/WonLostTabButton";
import { FunnelActionButtons } from "./controls/FunnelActionButtons";
import { WonLostFilters } from "./WonLostFilters";
import { Funnel } from "@/types/funnel";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCreateFunnel = async () => {
    const name = prompt("Nome do novo funil:");
    if (name) {
      const description = prompt("Descrição (opcional):");
      await onCreateFunnel(name, description || undefined);
    }
  };

  return (
    <div className="flex items-center justify-between w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-glass">
      {/* Lado Esquerdo - Tabs */}
      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/20">
        {/* Tab Funil de Vendas (apenas botão, sem dropdown) */}
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

        {/* Botão de seleção de funil (novo botão centralizado) */}
        {activeTab === "funnel" && (
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 font-medium shadow-sm"
              >
                <span className="truncate">Alterar Funil</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="w-[200px] bg-white/95 backdrop-blur-md border-white/50 shadow-glass z-50"
            >
              {funnels.map(funnel => (
                <DropdownMenuItem
                  key={funnel.id}
                  onClick={() => onSelectFunnel(funnel)}
                  className={`cursor-pointer text-gray-800 hover:bg-white/60 backdrop-blur-sm ${
                    selectedFunnel?.id === funnel.id ? 'bg-white/40' : ''
                  }`}
                >
                  <span className="truncate">{funnel.name}</span>
                </DropdownMenuItem>
              ))}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-white/30" />
                  <DropdownMenuItem 
                    onClick={handleCreateFunnel} 
                    className="cursor-pointer text-gray-800 hover:bg-white/60 backdrop-blur-sm"
                  >
                    Criar Novo Funil
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
