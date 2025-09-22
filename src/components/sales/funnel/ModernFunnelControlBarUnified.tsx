/**
 * 🎯 UNIFIED MODERN FUNNEL CONTROL BAR
 *
 * Barra de controle unificada para o sistema modular.
 * Inclui seleção de funil, filtros, visualizações e ações.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Search,
  Filter,
  X,
  RefreshCw,
  Settings,
  Tags,
  Users,
  Eye,
  BarChart3
} from "lucide-react";

interface Funnel {
  id: string;
  name: string;
  description?: string;
}

interface ModernFunnelControlBarUnifiedProps {
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onFunnelSelect: (funnel: Funnel) => void;
  onRefresh: () => void;
  onOpenTagModal: () => void;
  onOpenConfigModal: () => void;
  currentView: "board" | "won-lost";
  onViewChange: (view: "board" | "won-lost") => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedUser: string;
  onUserChange: (user: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export const ModernFunnelControlBarUnified: React.FC<ModernFunnelControlBarUnifiedProps> = ({
  funnels,
  selectedFunnel,
  onFunnelSelect,
  onRefresh,
  onOpenTagModal,
  onOpenConfigModal,
  currentView,
  onViewChange,
  searchTerm,
  onSearchChange,
  selectedTags,
  onTagsChange,
  selectedUser,
  onUserChange,
  hasActiveFilters,
  onClearFilters
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm sticky top-0 z-40">
      <div className="flex flex-col space-y-4 p-4">
        {/* Primeira linha: Seleção de funil e visualizações */}
        <div className="flex items-center justify-between">
          {/* Seleção do Funil */}
          <div className="flex items-center space-x-3">
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="min-w-[200px] justify-between bg-white/50 hover:bg-white/70"
                >
                  <span className="truncate">
                    {selectedFunnel?.name || "Selecione um funil"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                {funnels.map(funnel => (
                  <DropdownMenuItem
                    key={funnel.id}
                    onClick={() => {
                      onFunnelSelect(funnel);
                      setIsDropdownOpen(false);
                    }}
                    className={selectedFunnel?.id === funnel.id ? 'bg-blue-50' : ''}
                  >
                    <span className="truncate">{funnel.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              className="bg-white/50 hover:bg-white/70"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Alternador de Visualização */}
          <div className="flex items-center space-x-2">
            <Button
              variant={currentView === "board" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange("board")}
              className="bg-white/50 hover:bg-white/70"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Funil
            </Button>
            <Button
              variant={currentView === "won-lost" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange("won-lost")}
              className="bg-white/50 hover:bg-white/70"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ganhos/Perdas
            </Button>
          </div>

          {/* Ações */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTagModal}
              className="bg-white/50 hover:bg-white/70"
            >
              <Tags className="h-4 w-4 mr-2" />
              Tags
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenConfigModal}
              className="bg-white/50 hover:bg-white/70"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>

        {/* Segunda linha: Filtros */}
        {currentView === "board" && (
          <div className="flex items-center space-x-3">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-white/50"
              />
            </div>

            {/* Filtro por Tags */}
            <Select value="" onValueChange={(value) => {
              if (value && !selectedTags.includes(value)) {
                onTagsChange([...selectedTags, value]);
              }
            }}>
              <SelectTrigger className="w-[150px] bg-white/50">
                <SelectValue placeholder="Filtrar por tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tag1">Tag 1</SelectItem>
                <SelectItem value="tag2">Tag 2</SelectItem>
                <SelectItem value="tag3">Tag 3</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro por Usuário */}
            <Select value={selectedUser} onValueChange={onUserChange}>
              <SelectTrigger className="w-[150px] bg-white/50">
                <SelectValue placeholder="Filtrar por usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                <SelectItem value="user1">Usuário 1</SelectItem>
                <SelectItem value="user2">Usuário 2</SelectItem>
              </SelectContent>
            </Select>

            {/* Indicador de Filtros Ativos */}
            {hasActiveFilters && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Filter className="h-3 w-3 mr-1" />
                  Filtros ativos
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Tags selecionadas */}
            {selectedTags.length > 0 && (
              <div className="flex items-center space-x-1">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="outline" className="bg-white/50">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTagsChange(selectedTags.filter(t => t !== tag))}
                      className="h-4 w-4 p-0 ml-1"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};