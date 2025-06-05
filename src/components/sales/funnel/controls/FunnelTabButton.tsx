
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Funnel } from "@/types/funnel";

interface FunnelTabButtonProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onSelectFunnel: (funnel: Funnel) => void;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
  isAdmin: boolean;
}

export const FunnelTabButton = ({
  activeTab,
  setActiveTab,
  funnels,
  selectedFunnel,
  onSelectFunnel,
  onCreateFunnel,
  isAdmin
}: FunnelTabButtonProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCreateFunnel = async () => {
    const name = prompt("Nome do novo funil:");
    if (name) {
      const description = prompt("Descrição (opcional):");
      await onCreateFunnel(name, description || undefined);
    }
  };

  const handleFunnelButtonClick = (e: React.MouseEvent) => {
    if (activeTab === "won-lost") {
      // Se estiver na aba "Ganhos e Perdidos", volta para o funil sem abrir o dropdown
      e.preventDefault();
      e.stopPropagation();
      setActiveTab("funnel");
      setIsDropdownOpen(false);
    } else if (activeTab === "funnel") {
      // Se já estiver na aba "funnel", alterna o dropdown
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
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
  );
};
