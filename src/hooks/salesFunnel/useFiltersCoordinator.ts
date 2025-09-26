/**
 * 🔍 FILTERS COORDINATOR
 *
 * Hook coordenador isolado para a barra de filtros
 * Gerencia busca, filtro por tags e responsável
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { KanbanLead } from "@/types/kanban";

interface FiltersState {
  searchTerm: string;
  selectedTags: string[];
  selectedUser: string;
  isFiltering: boolean;
}

export interface UseFiltersCoordinatorReturn {
  // Estado
  state: FiltersState;

  // Ações de Filtro
  setSearchTerm: (term: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedUser: (userId: string) => void;
  clearFilters: () => void;

  // Toggles
  toggleTag: (tagId: string) => void;
  toggleUser: (userId: string) => void;

  // Utilitários
  hasActiveFilters: boolean;
  getFilteredLeads: (leads: KanbanLead[]) => KanbanLead[];
  getActiveFiltersCount: () => number;

  // Dados disponíveis
  getAvailableTags: (leads: KanbanLead[]) => Array<{id: string; name: string; color: string}>;
  getAvailableUsers: (leads: KanbanLead[]) => string[];
}

export function useFiltersCoordinator(): UseFiltersCoordinatorReturn {
  // Estado centralizado dos filtros
  const [state, setState] = useState<FiltersState>({
    searchTerm: "",
    selectedTags: [],
    selectedUser: "",
    isFiltering: false
  });

  // Verificar se há filtros ativos - otimizado para evitar recálculos desnecessários
  const hasActiveFilters = useMemo(() => {
    return !!(
      state.searchTerm ||
      state.selectedTags.length > 0 ||
      (state.selectedUser && state.selectedUser !== "all")
    );
  }, [state.searchTerm, state.selectedTags.length, state.selectedUser]); // Usar length em vez da array completa

  // Atualizar estado de filtragem
  useEffect(() => {
    setState(prev => ({ ...prev, isFiltering: hasActiveFilters }));
  }, [hasActiveFilters]);

  // Ações de Filtro
  const setSearchTerm = useCallback((term: string) => {
    console.log('[FiltersCoordinator] 🔍 Atualizando termo de busca:', term);
    setState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setSelectedTags = useCallback((tags: string[]) => {
    console.log('[FiltersCoordinator] 🏷️ Atualizando tags selecionadas:', tags.length);
    setState(prev => ({ ...prev, selectedTags: tags }));
  }, []);

  const setSelectedUser = useCallback((userId: string) => {
    console.log('[FiltersCoordinator] 👤 Atualizando usuário selecionado:', userId);
    setState(prev => ({ ...prev, selectedUser: userId }));
  }, []);

  const clearFilters = useCallback(() => {
    console.log('[FiltersCoordinator] 🧹 Limpando todos os filtros');
    setState({
      searchTerm: "",
      selectedTags: [],
      selectedUser: "",
      isFiltering: false
    });
  }, []);

  // Toggle de Tag
  const toggleTag = useCallback((tagId: string) => {
    setState(prev => {
      const newTags = prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId];

      console.log('[FiltersCoordinator] 🏷️ Toggle tag:', tagId, 'Total:', newTags.length);
      return { ...prev, selectedTags: newTags };
    });
  }, []);

  // Toggle de Usuário
  const toggleUser = useCallback((userId: string) => {
    setState(prev => {
      const newUser = prev.selectedUser === userId ? "" : userId;
      console.log('[FiltersCoordinator] 👤 Toggle usuário:', userId, 'Novo:', newUser);
      return { ...prev, selectedUser: newUser };
    });
  }, []);

  // Filtrar leads - otimizado para evitar recálculos desnecessários
  const getFilteredLeads = useCallback((leads: KanbanLead[]): KanbanLead[] => {
    if (!hasActiveFilters) return leads;

    let filtered = leads;

    // Filtro de busca
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(searchLower) ||
        lead.phone?.includes(state.searchTerm) ||
        lead.email?.toLowerCase().includes(searchLower) ||
        lead.company?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de tags
    if (state.selectedTags.length > 0) {
      filtered = filtered.filter(lead =>
        lead.tags?.some(tag => state.selectedTags.includes(tag.id))
      );
    }

    // Filtro de usuário
    if (state.selectedUser && state.selectedUser !== "all") {
      filtered = filtered.filter(lead =>
        lead.assignedUser === state.selectedUser
      );
    }

    // Log apenas quando há mudança significativa no resultado
    if (filtered.length !== leads.length) {
      console.log('[FiltersCoordinator] 📊 Leads filtrados:', filtered.length, 'de', leads.length);
    }
    return filtered;
  }, [hasActiveFilters, state.searchTerm, state.selectedTags.length, state.selectedTags, state.selectedUser]); // Otimizado dependencies

  // Contar filtros ativos - otimizado
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (state.searchTerm) count++;
    if (state.selectedTags.length > 0) count += state.selectedTags.length;
    if (state.selectedUser && state.selectedUser !== "all") count++;
    return count;
  }, [state.searchTerm, state.selectedTags.length, state.selectedUser]); // Otimizado dependencies

  // Extrair tags disponíveis
  const getAvailableTags = useCallback((leads: KanbanLead[]) => {
    const tagsMap = new Map<string, {id: string; name: string; color: string}>();

    leads.forEach(lead => {
      lead.tags?.forEach(tag => {
        if (!tagsMap.has(tag.id)) {
          tagsMap.set(tag.id, tag);
        }
      });
    });

    const tags = Array.from(tagsMap.values());
    // console.log('[FiltersCoordinator] 🏷️ Tags disponíveis:', tags.length);
    return tags;
  }, []);

  // Extrair usuários disponíveis
  const getAvailableUsers = useCallback((leads: KanbanLead[]) => {
    const usersSet = new Set<string>();

    leads.forEach(lead => {
      if (lead.assignedUser) {
        usersSet.add(lead.assignedUser);
      }
    });

    const users = Array.from(usersSet);
    // console.log('[FiltersCoordinator] 👥 Usuários disponíveis:', users.length);
    return users;
  }, []);

  return {
    state,

    // Ações
    setSearchTerm,
    setSelectedTags,
    setSelectedUser,
    clearFilters,

    // Toggles
    toggleTag,
    toggleUser,

    // Utilitários
    hasActiveFilters,
    getFilteredLeads,
    getActiveFiltersCount,

    // Dados
    getAvailableTags,
    getAvailableUsers
  };
}