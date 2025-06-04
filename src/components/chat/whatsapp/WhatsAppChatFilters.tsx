
import { useState } from "react";
import { Search, Filter, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const filters = [
    { key: "all", label: "Todas as conversas" },
    { key: "unread", label: "Não lidas" },
    { key: "archived", label: "Arquivadas" },
    { key: "groups", label: "Grupos" }
  ];

  return (
    <div className="p-6 border-b border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Conversas</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
              >
                <Filter className="h-5 w-5 text-gray-700" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white/90 backdrop-blur-md border-white/30">
              {filters.map((filter) => (
                <DropdownMenuItem
                  key={filter.key}
                  onClick={() => onFilterChange(filter.key)}
                  className={activeFilter === filter.key ? "bg-green-50 text-green-700" : ""}
                >
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-700" />
          </Button>
        </div>
      </div>
      
      {/* Search Bar Moderno */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
        <Input
          placeholder="Pesquisar conversas..."
          className="pl-12 bg-white/20 backdrop-blur-sm border-white/30 text-gray-900 placeholder-gray-600 focus:bg-white/30 focus:border-white/40 h-12 rounded-xl"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};
