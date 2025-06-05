
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
          className="bg-white/30 backdrop-blur-sm border-white/40 hover:bg-white/50 text-gray-800 hover:text-gray-900 min-w-[200px] justify-between font-medium shadow-sm"
        >
          <span className="truncate">
            {selectedFunnel?.name || "Selecionar Funil"}
          </span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px] bg-white/95 backdrop-blur-md border-white/50 shadow-glass z-50">
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
            <DropdownMenuItem onClick={handleCreateFunnel} className="cursor-pointer text-gray-800 hover:bg-white/60 backdrop-blur-sm">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Funil
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
