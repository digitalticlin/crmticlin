
import { useState } from "react";
import { Search, Menu, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FilterPopoverContent } from "./WhatsAppChatFilters/FilterPopoverContent";

interface WhatsAppChatFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const WhatsAppChatFilters = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange
}: WhatsAppChatFiltersProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const handleMainFilterClick = (filterKey: string, hasSubmenu: boolean) => {
    if (hasSubmenu) {
      setActiveSubmenu(filterKey);
    } else {
      onFilterChange(filterKey);
      setIsPopoverOpen(false);
    }
  };

  const handleSubmenuItemClick = (value: string) => {
    onFilterChange(value);
    setIsPopoverOpen(false);
    setActiveSubmenu(null);
  };

  const handleBackToMain = () => {
    setActiveSubmenu(null);
  };

  return (
    <div className="p-4 border-b border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-gray-900">Conversas</h1>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors"
          >
            <PenSquare className="h-4 w-4 text-gray-700" />
          </Button>
          
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors"
              >
                <Menu className="h-4 w-4 text-gray-700" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="bottom" 
              align="end"
              className="w-64 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl"
            >
              <FilterPopoverContent
                activeSubmenu={activeSubmenu}
                activeFilter={activeFilter}
                onMainFilterClick={handleMainFilterClick}
                onSubmenuItemClick={handleSubmenuItemClick}
                onBackToMain={handleBackToMain}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Pesquisar ou começar uma nova conversa"
          className="pl-10 bg-white/15 backdrop-blur-sm border-white/20 text-gray-900 placeholder-gray-600 focus:bg-white/25 focus:border-white/30 h-10 rounded-lg text-sm"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};
