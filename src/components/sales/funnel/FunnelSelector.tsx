
import { useState } from "react";
import { Funnel } from "@/types/funnel";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface FunnelSelectorProps {
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onSelectFunnel: (funnel: Funnel) => void;
  onCreateFunnel: (name: string, description?: string) => Promise<void>;
  isAdmin: boolean;
}

export function FunnelSelector({ 
  funnels, 
  selectedFunnel, 
  onSelectFunnel, 
  onCreateFunnel, 
  isAdmin 
}: FunnelSelectorProps) {
  const handleCreateFunnel = async () => {
    const name = prompt("Nome do novo funil:");
    if (name) {
      const description = prompt("Descrição (opcional):");
      await onCreateFunnel(name, description || undefined);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white/10 border-white/20 hover:bg-white/20 text-gray-700 hover:text-gray-900 min-w-[200px] justify-between"
        >
          <span className="truncate">
            {selectedFunnel?.name || "Selecionar Funil"}
          </span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {funnels.map(funnel => (
          <DropdownMenuItem
            key={funnel.id}
            onClick={() => onSelectFunnel(funnel)}
            className={`cursor-pointer ${
              selectedFunnel?.id === funnel.id ? 'bg-accent' : ''
            }`}
          >
            <span className="truncate">{funnel.name}</span>
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCreateFunnel} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Funil
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
