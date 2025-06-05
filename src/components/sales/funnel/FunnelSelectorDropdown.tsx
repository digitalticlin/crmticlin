
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, Settings } from "lucide-react";
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
        <Button variant="outline" className="gap-2 max-w-[250px] justify-between">
          <span className="truncate">
            {selectedFunnel ? selectedFunnel.name : "Selecione um funil"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]">
        {funnels.length > 0 ? (
          <>
            {funnels.map((funnel) => (
              <DropdownMenuItem
                key={funnel.id}
                onClick={() => {
                  onSelectFunnel(funnel);
                  setIsOpen(false);
                }}
                className={selectedFunnel?.id === funnel.id ? "bg-accent" : ""}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{funnel.name}</span>
                  {funnel.description && (
                    <span className="text-xs text-muted-foreground truncate">
                      {funnel.description}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            {isAdmin && <DropdownMenuSeparator />}
          </>
        ) : (
          <DropdownMenuItem disabled>
            Nenhum funil encontrado
          </DropdownMenuItem>
        )}
        
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={onCreateNewFunnel}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Funil
            </DropdownMenuItem>
            {onManageFunnels && (
              <DropdownMenuItem onClick={onManageFunnels}>
                <Settings className="h-4 w-4 mr-2" />
                Gerenciar Funis
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
