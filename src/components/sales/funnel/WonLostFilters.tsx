
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Search, Tag, User, X } from "lucide-react";
import { KanbanTag } from "@/types/kanban";

interface WonLostFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedUser: string;
  setSelectedUser: (user: string) => void;
  availableTags: KanbanTag[];
  availableUsers: string[];
  onClearFilters: () => void;
  resultsCount: number;
}

export const WonLostFilters = ({
  searchTerm,
  setSearchTerm,
  selectedTags,
  setSelectedTags,
  selectedUser,
  setSelectedUser,
  availableTags,
  availableUsers,
  onClearFilters,
  resultsCount
}: WonLostFiltersProps) => {
  const hasActiveFilters = searchTerm || selectedTags.length > 0 || selectedUser;

  const toggleTag = (tagId: string) => {
    setSelectedTags(
      selectedTags.includes(tagId)
        ? selectedTags.filter(id => id !== tagId)
        : [...selectedTags, tagId]
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Barra de Pesquisa */}
      <div className="relative min-w-[200px] flex-1 max-w-[300px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
        <Input
          placeholder="Pesquisar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/20 backdrop-blur-lg border-white/30 rounded-2xl text-gray-700 placeholder-gray-500 focus:bg-white/30 focus:border-ticlin/50 h-9"
        />
      </div>

      {/* Filtro por Tags */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-white/20 backdrop-blur-lg border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl h-9 px-3"
          >
            <Tag className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Etiquetas</span>
            {selectedTags.length > 0 && (
              <span className="ml-1 bg-ticlin text-black text-xs px-1.5 py-0.5 rounded-full">
                {selectedTags.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass p-2 z-50">
          {availableTags.map((tag) => (
            <DropdownMenuItem
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`rounded-xl p-3 cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                selectedTags.includes(tag.id) 
                  ? "bg-ticlin/20 text-ticlin-dark" 
                  : "hover:bg-white/50"
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: tag.color }}
              />
              <span className="font-medium">{tag.name}</span>
              {selectedTags.includes(tag.id) && (
                <div className="ml-auto w-2 h-2 bg-ticlin-dark rounded-full" />
              )}
            </DropdownMenuItem>
          ))}
          {availableTags.length === 0 && (
            <DropdownMenuItem disabled className="rounded-xl p-3 text-gray-500">
              Nenhuma etiqueta encontrada
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filtro por Usuário */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-white/20 backdrop-blur-lg border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl h-9 px-3"
          >
            <User className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Responsável</span>
            {selectedUser && (
              <span className="ml-1 bg-ticlin text-black text-xs px-1.5 py-0.5 rounded-full">
                1
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-glass p-2 z-50">
          <DropdownMenuItem
            onClick={() => setSelectedUser("")}
            className={`rounded-xl p-3 cursor-pointer transition-all duration-200 ${
              !selectedUser ? "bg-ticlin/20 text-ticlin-dark" : "hover:bg-white/50"
            }`}
          >
            Todos os responsáveis
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-2 bg-white/30" />
          {availableUsers.map((user) => (
            <DropdownMenuItem
              key={user}
              onClick={() => setSelectedUser(user)}
              className={`rounded-xl p-3 cursor-pointer transition-all duration-200 ${
                selectedUser === user 
                  ? "bg-ticlin/20 text-ticlin-dark" 
                  : "hover:bg-white/50"
              }`}
            >
              {user || "Sem responsável"}
            </DropdownMenuItem>
          ))}
          {availableUsers.length === 0 && (
            <DropdownMenuItem disabled className="rounded-xl p-3 text-gray-500">
              Nenhum responsável encontrado
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Contador removido conforme solicitado */}

      {/* Botão Limpar Filtros */}
      {hasActiveFilters && (
        <Button
          onClick={onClearFilters}
          variant="outline"
          className="bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-700 hover:text-red-800 rounded-2xl h-9 px-3"
        >
          <X className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Limpar</span>
        </Button>
      )}
    </div>
  );
};
