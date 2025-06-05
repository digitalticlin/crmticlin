
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, Settings, Zap } from "lucide-react";
import { Funnel } from "@/types/funnel";

interface FunnelSelectorDropdownProps {
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onSelectFunnel: (funnel: Funnel) => void;
  onCreateNewFunnel: () => void;
  onManageFunnels?: () => void;
  isAdmin?: boolean;
}

export const FunnelSelectorDropdown = ({
  funnels,
  selectedFunnel,
  onSelectFunnel,
  onCreateNewFunnel,
  onManageFunnels,
  isAdmin = false
}: FunnelSelectorDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/20 backdrop-blur-lg border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl px-4 py-2.5 h-auto min-w-[200px] justify-between transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-ticlin-dark" />
            <span className="truncate font-medium">
              {selectedFunnel ? selectedFunnel.name : "Selecione um funil"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px] bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-2">
        {funnels.length > 0 ? (
          <>
            {funnels.map((funnel) => (
              <DropdownMenuItem
                key={funnel.id}
                onClick={() => {
                  onSelectFunnel(funnel);
                  setIsOpen(false);
                }}
                className={`rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                  selectedFunnel?.id === funnel.id 
                    ? "bg-ticlin/20 text-ticlin-dark font-medium" 
                    : "hover:bg-white/50"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">{funnel.name}</span>
                  {funnel.description && (
                    <span className="text-xs text-gray-600 truncate mt-1">
                      {funnel.description}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {isAdmin && <DropdownMenuSeparator className="my-2 bg-white/30" />}
          </>
        ) : (
          <DropdownMenuItem disabled className="rounded-xl p-3 text-gray-500">
            Nenhum funil encontrado
          </DropdownMenuItem>
        )}
        
        {isAdmin && (
          <>
            <DropdownMenuItem 
              onClick={onCreateNewFunnel}
              className="rounded-xl p-3 cursor-pointer hover:bg-ticlin/20 transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2 text-ticlin-dark" />
              <span className="text-gray-800 font-medium">Criar Novo Funil</span>
            </DropdownMenuItem>
            {onManageFunnels && (
              <DropdownMenuItem 
                onClick={onManageFunnels}
                className="rounded-xl p-3 cursor-pointer hover:bg-gray-100/50 transition-all duration-200"
              >
                <Settings className="h-4 w-4 mr-2 text-gray-600" />
                <span className="text-gray-700">Gerenciar Funis</span>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
