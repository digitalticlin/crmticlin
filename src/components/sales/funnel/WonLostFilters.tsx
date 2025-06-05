
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
    <div className="flex flex-col gap-4">
      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
        <Input
          placeholder="Pesquisar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-white/20 backdrop-blur-lg border-white/30 rounded-2xl text-gray-700 placeholder-gray-500 focus:bg-white/30 focus:border-ticlin/50"
        />
      </div>

      {/* Filtros e Contadores */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro por Tags */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-white/20 backdrop-blur-lg border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl h-auto py-2 px-4"
            >
              <Tag className="w-4 h-4 mr-2" />
              Etiquetas
              {selectedTags.length > 0 && (
                <span className="ml-1 bg-ticlin text-black text-xs px-2 py-0.5 rounded-full">
                  {selectedTags.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-2">
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
              className="bg-white/20 backdrop-blur-lg border-white/30 hover:bg-white/30 text-gray-700 hover:text-gray-800 rounded-2xl h-auto py-2 px-4"
            >
              <User className="w-4 h-4 mr-2" />
              Responsável
              {selectedUser && (
                <span className="ml-1 bg-ticlin text-black text-xs px-2 py-0.5 rounded-full">
                  1
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white/90 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-2">
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

        {/* Contador de Resultados */}
        <div className="text-sm text-gray-600 bg-white/20 backdrop-blur-lg rounded-2xl px-3 py-2">
          {resultsCount} resultado{resultsCount !== 1 ? 's' : ''} encontrado{resultsCount !== 1 ? 's' : ''}
        </div>

        {/* Botão Limpar Filtros */}
        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="bg-red-500/20 border-red-500/30 hover:bg-red-500/30 text-red-700 hover:text-red-800 rounded-2xl h-auto py-2 px-4"
          >
            <X className="w-4 h-4 mr-2" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
};
