
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, TrendingUp } from "lucide-react";

interface DealsHistoryHeaderProps {
  dealsCount: number;
  onAddDealClick: () => void;
}

export function DealsHistoryHeader({ dealsCount, onAddDealClick }: DealsHistoryHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-[#d3d800]" />
        <div>
          <h3 className="text-lg font-semibold text-white">Histórico de Negociações</h3>
          <p className="text-sm text-white/70">{dealsCount} negociações registradas</p>
        </div>
      </div>
      
      <Button 
        size="sm" 
        className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
        onClick={onAddDealClick}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar
      </Button>
    </div>
  );
}
