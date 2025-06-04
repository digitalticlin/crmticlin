
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { initialColumns } from "@/data/initialSalesFunnelData";
import { getFunnelStageColor } from "@/utils/tagColors";

interface FilterFunnelSubmenuProps {
  onBack: () => void;
  onItemClick: (value: string) => void;
}

export const FilterFunnelSubmenu = ({ onBack, onItemClick }: FilterFunnelSubmenuProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-1 h-6 w-6 rounded-full hover:bg-white/30"
          onClick={onBack}
        >
          ‹
        </Button>
        <h4 className="text-sm font-medium text-gray-700">Etapas do Funil</h4>
      </div>
      
      <div className="grid gap-0.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
        {initialColumns.map((column) => (
          <Button 
            key={column.id}
            variant="ghost" 
            size="sm" 
            className="justify-start text-gray-700 hover:bg-white/30 hover:text-gray-900 rounded-xl transition-all duration-200 py-1.5 px-2"
            onClick={() => onItemClick(`column-${column.id}`)}
          >
            <div className={cn(
              "w-3 h-3 rounded-full mr-2",
              getFunnelStageColor(column.color || "bg-gray-400")
            )} />
            {column.title}
          </Button>
        ))}
      </div>
    </div>
  );
};
