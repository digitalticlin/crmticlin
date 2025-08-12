import { FunnelTabButton } from "./controls/FunnelTabButton";
import { WonLostTabButton } from "./controls/WonLostTabButton";
import { Funnel } from "@/types/funnel";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
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
      <div className="relative flex items-center w-full p-2">
        {/* Grupo CENTRALIZADO: Tabs + Alterar Funil */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FunnelTabButton
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              funnels={funnels}
              selectedFunnel={selectedFunnel}
              onSelectFunnel={onSelectFunnel}
              onCreateFunnel={onCreateFunnel}
              isAdmin={isAdmin}
            />

            <WonLostTabButton
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* Dropdown Alterar Funil sempre renderizado para manter alinhamento entre abas */}
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
        </div>

        {/* Ações à DIREITA: + (menu rápido) e Personalizar */}
        <div className="ml-auto flex items-center gap-3">
          {activeTab === "funnel" && (
            <div className="flex items-center gap-2">
              {/* Botão + com efeito neon/lemon e menu rápido */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Ações rápidas"
                    className="h-10 w-10 rounded-full flex items-center justify-center text-lime-800 bg-gradient-to-br from-lime-200/70 to-lime-300/50 border border-lime-400/60 backdrop-blur-md shadow-[0_0_14px_rgba(163,230,53,0.6)] ring-2 ring-lime-300/50 hover:ring-4 hover:shadow-[0_0_22px_rgba(163,230,53,0.9)] hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-lime-400/70 transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-white/90 backdrop-blur-md border-white/50 shadow-glass">
                  <DropdownMenuItem onClick={onAddLead} className="cursor-pointer">Novo Lead</DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={handleManageTags} className="cursor-pointer">Tags</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Personalizar (substitui ícone de engrenagem) */}
              {isAdmin && (
                <Button
                  onClick={onEditFunnel}
                  size="sm"
                  className="rounded-full h-9 px-4 bg-white/50 hover:bg-white/60 backdrop-blur-md border border-white/60 text-gray-900 font-semibold shadow-glass transition-colors"
                >
                  Personalizar Funil
                </Button>
              )}
            </div>
          )}

          {activeTab === "won-lost" && (
            // Placeholders invisíveis para manter a mesma largura do grupo de ações da aba Funil
            <div className="flex items-center gap-2">
              <button
                aria-hidden
                className="h-10 w-10 rounded-full invisible"
                tabIndex={-1}
              />
              {isAdmin && (
                <Button
                  size="sm"
                  aria-hidden
                  className="rounded-full h-9 px-4 invisible"
                  tabIndex={-1}
                >
                  Personalizar Funil
                </Button>
              )}
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
