import { FunnelTabButton } from "./controls/FunnelTabButton";
import { WonLostTabButton } from "./controls/WonLostTabButton";
import { Funnel } from "@/types/funnel";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, Plus, Settings, UserPlus, Cog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SimplifiedTagModal } from "../tags/SimplifiedTagModal";
import { useSimplifiedTagModal } from "@/hooks/salesFunnel/useSimplifiedTagModal";

interface ModernFunnelControlBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddColumn: () => void;
  onManageTags: () => void;
  onAddLead: () => void;
  onEditFunnel: () => void;
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onSelectFunnel: (funnel: Funnel) => void;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
  isAdmin: boolean;
}

export const ModernFunnelControlBar = ({
  activeTab,
  setActiveTab,
  onAddColumn,
  onManageTags,
  onAddLead,
  onEditFunnel,
  funnels,
  selectedFunnel,
  onSelectFunnel,
  onCreateFunnel,
  isAdmin
}: ModernFunnelControlBarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const {
    isOpen: isTagModalOpen,
    setIsOpen: setIsTagModalOpen,
    tags,
    isLoading: isTagsLoading,
    handleCreateTag,
    handleUpdateTag,
    handleDeleteTag,
  } = useSimplifiedTagModal();

  const handleCreateFunnel = async () => {
    const name = prompt("Nome do novo funil:");
    if (name) {
      const description = prompt("Descrição (opcional):");
      await onCreateFunnel(name, description || undefined);
    }
  };

  const handleManageTags = () => {
    setIsTagModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-glass">
        {/* Lado Esquerdo - Tabs e Botão de Alterar Funil */}
        <div className="flex items-center gap-3">
          {/* Card dos Tabs */}
          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-xl p-1 border border-white/20">
            {/* Tab Funil de Vendas */}
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

          {/* Botão de seleção de funil (agora fora do card) */}
          {activeTab === "funnel" && (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 font-medium shadow-sm"
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
            <div className="flex items-center gap-2">
              {/* Botão Adicionar Lead */}
              <Button
                onClick={onAddLead}
                size="sm"
                className="bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-sm text-white border border-blue-400/30 shadow-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Lead
              </Button>

              {/* Botão Gerenciar Tags */}
              {isAdmin && (
                <Button
                  onClick={handleManageTags}
                  variant="outline"
                  size="sm"
                  className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 shadow-sm"
                >
                  Tags
                </Button>
              )}

              {/* Botão Editar Funil (Engrenagem) */}
              {isAdmin && (
                <Button
                  onClick={onEditFunnel}
                  variant="outline"
                  size="sm"
                  className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 shadow-sm"
                >
                  <Cog className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {activeTab === "won-lost" && (
            <div className="text-sm text-gray-600 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              Filtros serão implementados aqui
            </div>
          )}
        </div>
      </div>

      {/* Modal de Tags Simplificado */}
      <SimplifiedTagModal
        isOpen={isTagModalOpen}
        onOpenChange={setIsTagModalOpen}
        tags={tags}
        onCreateTag={handleCreateTag}
        onUpdateTag={handleUpdateTag}
        onDeleteTag={handleDeleteTag}
      />
    </>
  );
};
