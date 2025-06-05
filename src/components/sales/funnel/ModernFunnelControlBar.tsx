
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Tag, 
  UserPlus,
  ChevronDown
} from "lucide-react";
import { WonLostFilters } from "./WonLostFilters";
import { TagManagementModal } from "./modals/TagManagementModal";
import { CreateLeadModal } from "./modals/CreateLeadModal";
import { FunnelConfigModal } from "./modals/FunnelConfigModal";
import { Funnel } from "@/types/funnel";
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
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isFunnelConfigOpen, setIsFunnelConfigOpen] = useState(false);

  const handleCreateFunnel = async () => {
    const name = prompt("Nome do novo funil:");
    if (name) {
      const description = prompt("Descrição (opcional):");
      await onCreateFunnel(name, description || undefined);
    }
  };

  const handleFunnelButtonClick = () => {
    if (activeTab === "won-lost") {
      // Se estiver na aba "Ganhos e Perdidos", volta para o funil
      setActiveTab("funnel");
    }
    // Se já estiver na aba "funnel", o dropdown abre automaticamente pelo DropdownMenuTrigger
  };

  return (
    <div className="flex items-center justify-between w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-glass">
      {/* Lado Esquerdo - Tabs com Funnel Selector integrado */}
      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/20">
        {/* Tab Funil de Vendas com Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                activeTab === "funnel"
                  ? "bg-white/80 text-gray-900 shadow-md backdrop-blur-sm"
                  : "text-gray-800 hover:text-gray-900 hover:bg-white/30"
              }`}
              onClick={handleFunnelButtonClick}
            >
              <span className="truncate">
                {selectedFunnel?.name || "Funil de Vendas"}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          {/* Só mostra o dropdown se estiver na aba funnel */}
          {activeTab === "funnel" && (
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
          )}
        </DropdownMenu>

        {/* Tab Ganhos e Perdidos */}
        <button
          onClick={() => setActiveTab("won-lost")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === "won-lost"
              ? "bg-white/80 text-gray-900 shadow-md backdrop-blur-sm"
              : "text-gray-800 hover:text-gray-900 hover:bg-white/30"
          }`}
        >
          Ganhos e Perdidos
        </button>
      </div>

      {/* Lado Direito - Botões de Ação */}
      <div className="flex items-center gap-3">
        {activeTab === "funnel" && (
          <>
            {/* Botão de Etiquetas */}
            <Button
              onClick={() => setIsTagModalOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 font-medium shadow-sm"
            >
              <Tag className="w-4 h-4 mr-2" />
              Etiquetas
            </Button>

            {/* Botão de Adicionar Lead */}
            <Button
              onClick={() => setIsLeadModalOpen(true)}
              variant="outline"
              size="sm"
              className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 font-medium shadow-sm"
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
                className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 shadow-sm"
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
