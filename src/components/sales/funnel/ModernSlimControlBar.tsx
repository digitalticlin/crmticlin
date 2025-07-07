
import { FunnelTabButton } from "./controls/FunnelTabButton";
import { WonLostTabButton } from "./controls/WonLostTabButton";
import { Funnel } from "@/types/funnel";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, Plus, UserPlus, Cog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ModernSlimControlBarProps {
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

export const ModernSlimControlBar = ({
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
}: ModernSlimControlBarProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCreateFunnel = async () => {
    const name = prompt("Nome do novo funil:");
    if (name) {
      const description = prompt("Descrição (opcional):");
      await onCreateFunnel(name, description || undefined);
    }
  };

  return (
    <div className="flex items-center justify-between w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-xl p-2 shadow-glass h-[50px]">
      {/* Lado Esquerdo - Navegação Compacta */}
      <div className="flex items-center gap-2">
        {/* Tabs em card compacto */}
        <div className="flex items-center gap-0.5 bg-white/15 backdrop-blur-sm rounded-lg p-0.5 border border-white/20">
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

        {/* Seletor de funil compacto - apenas no funil */}
        {activeTab === "funnel" && (
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/25 backdrop-blur-sm border-white/30 hover:bg-white/40 text-gray-800 hover:text-gray-900 text-xs h-8 px-2"
              >
                <span className="truncate max-w-[80px]">Alterar</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px] bg-white/95 backdrop-blur-md border-white/50 shadow-glass z-50">
              {funnels.map(funnel => (
                <DropdownMenuItem
                  key={funnel.id}
                  onClick={() => onSelectFunnel(funnel)}
                  className={`cursor-pointer text-gray-800 hover:bg-white/60 backdrop-blur-sm text-xs ${
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
                    className="cursor-pointer text-gray-800 hover:bg-white/60 backdrop-blur-sm text-xs"
                  >
                    Criar Novo Funil
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Lado Direito - Ações Compactas */}
      <div className="flex items-center gap-1">
        {activeTab === "funnel" && (
          <>
            {/* Botão Lead */}
            <Button
              onClick={onAddLead}
              size="sm"
              className="bg-blue-500/80 hover:bg-blue-600/80 backdrop-blur-sm text-white border border-blue-400/30 text-xs h-8 px-2"
            >
              <UserPlus className="w-3 h-3 mr-1" />
              Lead
            </Button>

            {/* Botões Admin */}
            {isAdmin && (
              <>
                <Button
                  onClick={onManageTags}
                  variant="outline"
                  size="sm"
                  className="bg-white/25 backdrop-blur-sm border-white/30 hover:bg-white/40 text-gray-800 hover:text-gray-900 text-xs h-8 px-2"
                >
                  Tags
                </Button>
                <Button
                  onClick={onAddColumn}
                  variant="outline"
                  size="sm"
                  className="bg-white/25 backdrop-blur-sm border-white/30 hover:bg-white/40 text-gray-800 hover:text-gray-900 text-xs h-8 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Etapa
                </Button>
                <Button
                  onClick={onEditFunnel}
                  variant="outline"
                  size="sm"
                  className="bg-white/25 backdrop-blur-sm border-white/30 hover:bg-white/40 text-gray-800 hover:text-gray-900 text-xs h-8 px-1"
                >
                  <Cog className="w-3 h-3" />
                </Button>
              </>
            )}
          </>
        )}

        {activeTab === "won-lost" && (
          <div className="text-xs text-gray-600 bg-white/15 backdrop-blur-sm rounded-md px-2 py-1">
            Filtros disponíveis
          </div>
        )}
      </div>
    </div>
  );
};
