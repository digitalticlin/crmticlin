
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
          className="bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800 hover:text-gray-900 min-w-[200px] justify-between font-medium"
        >
          <span className="truncate">
            {selectedFunnel?.name || "Selecionar Funil"}
          </span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px] bg-white border-gray-200 shadow-lg z-50">
        {funnels.map(funnel => (
          <DropdownMenuItem
            key={funnel.id}
            onClick={() => onSelectFunnel(funnel)}
            className={`cursor-pointer text-gray-800 hover:bg-gray-50 ${
              selectedFunnel?.id === funnel.id ? 'bg-gray-100' : ''
            }`}
          >
            <span className="truncate">{funnel.name}</span>
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem onClick={handleCreateFunnel} className="cursor-pointer text-gray-800 hover:bg-gray-50">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Funil
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
