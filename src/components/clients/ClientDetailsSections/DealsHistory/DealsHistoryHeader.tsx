
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";

interface DealsHistoryHeaderProps {
  onAddDeal: () => void;
  isLoading: boolean;
}

export function DealsHistoryHeader({ onAddDeal, isLoading }: DealsHistoryHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-[#d3d800]" />
        <div>
          <h3 className="text-lg font-semibold text-white">Histórico de Negociações</h3>
        </div>
      </div>
      
      <Button 
        size="sm" 
        className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
        onClick={onAddDeal}
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar
      </Button>
    </div>
  );
}
