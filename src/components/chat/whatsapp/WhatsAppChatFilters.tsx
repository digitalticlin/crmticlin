
import { useState } from "react";
import { Search, Menu, PenSquare } from "lucide-react";
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors"
              >
                <Menu className="h-4 w-4 text-gray-700" />
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
        </div>
      </div>
      
      {/* Search Bar Sutil */}
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
