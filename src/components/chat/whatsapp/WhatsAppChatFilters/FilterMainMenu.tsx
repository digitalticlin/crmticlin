
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mainFilters } from "./filtersConfig";

interface FilterMainMenuProps {
  activeFilter: string;
  onFilterClick: (filterKey: string, hasSubmenu: boolean) => void;
}

export const FilterMainMenu = ({ activeFilter, onFilterClick }: FilterMainMenuProps) => {
  return (
    <div className="grid gap-2">
      {mainFilters.map((filter) => {
        const IconComponent = filter.icon;
        return (
          <Button 
            key={filter.key}
            variant="ghost" 
            size="sm" 
            className={cn(
              "justify-start text-gray-700 hover:bg-white/30 hover:text-gray-900 rounded-xl transition-all duration-200",
              activeFilter === filter.key && "bg-white/30 text-gray-900"
            )}
            onClick={() => onFilterClick(filter.key, filter.hasSubmenu)}
          >
            <IconComponent className="h-4 w-4 mr-2" />
            {filter.label}
            {filter.hasSubmenu && <span className="ml-auto text-xs">›</span>}
          </Button>
        );
      })}
    </div>
  );
};
