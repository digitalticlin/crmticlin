
import { useState } from "react";
import { Search, Menu, PenSquare, MessageCircle, Circle, Tags, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { unifiedTags } from "@/data/unifiedFakeData";
import { initialColumns } from "@/data/initialSalesFunnelData";

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

  const mainFilters = [
    { 
      key: "all", 
      label: "Todas conversas", 
      icon: MessageCircle,
      hasSubmenu: false 
    },
    { 
      key: "unread", 
      label: "Não lidas", 
      icon: Circle,
      hasSubmenu: false 
    },
    { 
      key: "tags", 
      label: "Etiquetas", 
      icon: Tags,
      hasSubmenu: true 
    },
    { 
      key: "funnel", 
      label: "Etapa do funil", 
      icon: TrendingUp,
      hasSubmenu: true 
    }
  ];

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

  const renderMainMenu = () => (
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
            onClick={() => handleMainFilterClick(filter.key, filter.hasSubmenu)}
          >
            <IconComponent className="h-4 w-4 mr-2" />
            {filter.label}
            {filter.hasSubmenu && <span className="ml-auto text-xs">›</span>}
          </Button>
        );
      })}
    </div>
  );

  const renderTagsSubmenu = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-1 h-6 w-6 rounded-full hover:bg-white/30"
          onClick={handleBackToMain}
        >
          ‹
        </Button>
        <h4 className="text-sm font-medium text-gray-700">Etiquetas</h4>
      </div>
      
      <div className="grid gap-1 max-h-48 overflow-y-auto">
        {unifiedTags.map((tag) => (
          <Button 
            key={tag.id}
            variant="ghost" 
            size="sm" 
            className="justify-start text-gray-700 hover:bg-white/30 hover:text-gray-900 rounded-xl transition-all duration-200 h-auto p-2"
            onClick={() => handleSubmenuItemClick(`tag-${tag.id}`)}
          >
            <Badge 
              className={cn(
                "text-xs mr-2 text-white border-white/20",
                tag.color
              )}
            >
              {tag.name}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  );

  const renderFunnelSubmenu = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-1 h-6 w-6 rounded-full hover:bg-white/30"
          onClick={handleBackToMain}
        >
          ‹
        </Button>
        <h4 className="text-sm font-medium text-gray-700">Etapas do Funil</h4>
      </div>
      
      <div className="grid gap-1 max-h-48 overflow-y-auto">
        {initialColumns.map((column) => (
          <Button 
            key={column.id}
            variant="ghost" 
            size="sm" 
            className="justify-start text-gray-700 hover:bg-white/30 hover:text-gray-900 rounded-xl transition-all duration-200"
            onClick={() => handleSubmenuItemClick(`column-${column.id}`)}
          >
            <div className={cn(
              "w-3 h-3 rounded-full mr-2",
              column.color || "bg-gray-400"
            )} />
            {column.title}
          </Button>
        ))}
      </div>
    </div>
  );

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
              {activeSubmenu === null && renderMainMenu()}
              {activeSubmenu === "tags" && renderTagsSubmenu()}
              {activeSubmenu === "funnel" && renderFunnelSubmenu()}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Search Bar */}
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
