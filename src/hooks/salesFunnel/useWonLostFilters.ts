
import { useState, useMemo } from "react";
import { KanbanLead, KanbanTag } from "@/types/kanban";

export interface WonLostFilters {
  searchTerm: string;
  selectedTags: string[];
  selectedUser: string;
}

export const useWonLostFilters = (leads: KanbanLead[], availableTags: KanbanTag[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState("");

  // Extrair usuários únicos dos leads
  const availableUsers = useMemo(() => {
    const users = leads
      .map(lead => lead.assignedUser)
      .filter((user, index, arr) => user && arr.indexOf(user) === index);
    return users;
  }, [leads]);

  // Aplicar filtros aos leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Filtro por texto (nome ou telefone)
      const matchesSearch = !searchTerm || 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);

      // Filtro por tags
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tagId => lead.tags.some(tag => tag.id === tagId));

      // Filtro por usuário responsável
      const matchesUser = !selectedUser || lead.assignedUser === selectedUser;

      return matchesSearch && matchesTags && matchesUser;
    });
  }, [leads, searchTerm, selectedTags, selectedUser]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
    setSelectedUser("");
  };

  return {
    // Estado dos filtros
    searchTerm,
    setSearchTerm,
    selectedTags,
    setSelectedTags,
    selectedUser,
    setSelectedUser,
    
    // Dados processados
    filteredLeads,
    availableUsers,
    resultsCount: filteredLeads.length,
    
    // Ações
    clearAllFilters
  };
};
