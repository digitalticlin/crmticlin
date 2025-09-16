/**
 * 🎯 DATAFILTERS ISOLADOS - PÁGINA CLIENTS
 * Sistema de filtros 100% isolado para a página de clientes
 * GARANTE: Multi-tenant com created_by_user_id
 */

import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserRole } from "@/hooks/useUserRole";

export interface ClientsPageFilters {
  // Identificação Multi-tenant
  userId: string | null;
  companyId: string | null;
  role: 'admin' | 'operational' | 'user' | null;
  
  // Filtros de Acesso
  createdByUserId: string | null; // CRÍTICO: Sempre filtrar por isto
  ownerFilter: string | null; // Para operacionais
  whatsappInstancesFilter: string[] | null; // Instâncias permitidas
  
  // Filtros de UI
  searchQuery: string;
  selectedTags: string[];
  selectedCompanies: string[];
  selectedStates: string[];
  selectedCities: string[];
  selectedCountries: string[];
  dateRange: { from: Date | null; to: Date | null };
  responsibleUsers: string[];
  funnelIds: string[];
  funnelStages: string[];
  
  // Estado
  loading: boolean;
  error: string | null;
}

/**
 * Hook principal de filtros da página Clients
 * ISOLADO: Não depende de nenhum filtro compartilhado
 */
export const useClientsPageFilters = (): ClientsPageFilters => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { data: companyData, loading: companyLoading } = useCompanyData();
  
  // CRÍTICO: Determinar filtro multi-tenant baseado no role
  const getMultiTenantFilter = () => {
    if (!user?.id) return null;
    
    if (role === 'admin') {
      // Admin vê apenas o que criou
      return user.id;
    } else if (role === 'operational') {
      // Operacional vê o que foi atribuído via owner ou instância
      return null; // Será filtrado por owner_id ou whatsapp_instances
    }
    
    return user.id; // Padrão: usuário vê apenas seus próprios dados
  };
  
  // Obter instâncias WhatsApp permitidas para operacionais
  const getWhatsAppInstancesFilter = (): string[] | null => {
    if (role !== 'operational') return null;
    
    // TODO: Buscar instâncias atribuídas ao operacional
    // Por enquanto retorna null, será implementado com queries
    return null;
  };
  
  return {
    // Multi-tenant
    userId: user?.id || null,
    companyId: companyData?.id || null,
    role: role as 'admin' | 'operational' | 'user' | null,
    
    // Filtros de Acesso (CRÍTICO PARA MULTI-TENANT)
    createdByUserId: getMultiTenantFilter(),
    ownerFilter: role === 'operational' ? user?.id || null : null,
    whatsappInstancesFilter: getWhatsAppInstancesFilter(),
    
    // Filtros de UI (iniciais vazios)
    searchQuery: '',
    selectedTags: [],
    selectedCompanies: [],
    selectedStates: [],
    selectedCities: [],
    selectedCountries: [],
    dateRange: { from: null, to: null },
    responsibleUsers: [],
    funnelIds: [],
    funnelStages: [],
    
    // Estado
    loading: roleLoading || companyLoading,
    error: null
  };
};

/**
 * Hook para gerenciar estado local dos filtros
 * Permite atualização dos filtros de UI mantendo a segurança multi-tenant
 */
export const useClientsFilterState = () => {
  const baseFilters = useClientsPageFilters();
  const [localFilters, setLocalFilters] = useState<Partial<ClientsPageFilters>>({});
  
  // Merge dos filtros base (multi-tenant) com filtros locais (UI)
  const filters: ClientsPageFilters = {
    ...baseFilters,
    ...localFilters,
    // NUNCA permitir sobrescrever filtros de segurança
    userId: baseFilters.userId,
    companyId: baseFilters.companyId,
    role: baseFilters.role,
    createdByUserId: baseFilters.createdByUserId,
    ownerFilter: baseFilters.ownerFilter,
    whatsappInstancesFilter: baseFilters.whatsappInstancesFilter
  };
  
  // Função para atualizar apenas filtros de UI
  const updateFilters = (updates: Partial<ClientsPageFilters>) => {
    // Remover campos de segurança se tentarem ser atualizados
    const { 
      userId, 
      companyId, 
      role, 
      createdByUserId, 
      ownerFilter, 
      whatsappInstancesFilter,
      ...safeUpdates 
    } = updates;
    
    setLocalFilters(prev => ({ ...prev, ...safeUpdates }));
  };
  
  const resetFilters = () => {
    setLocalFilters({});
  };
  
  return {
    filters,
    updateFilters,
    resetFilters,
    isFiltered: Object.keys(localFilters).length > 0
  };
};

/**
 * Validador de acesso multi-tenant
 * Verifica se um registro pode ser acessado pelo usuário atual
 */
export const validateClientAccess = (
  client: any,
  filters: ClientsPageFilters
): boolean => {
  if (!filters.userId) return false;
  
  // Admin: só vê o que criou
  if (filters.role === 'admin') {
    return client.created_by_user_id === filters.createdByUserId;
  }
  
  // Operacional: vê o que foi atribuído
  if (filters.role === 'operational') {
    // Verificar por owner_id
    if (filters.ownerFilter && client.owner_id === filters.ownerFilter) {
      return true;
    }
    
    // Verificar por instância WhatsApp
    if (filters.whatsappInstancesFilter?.includes(client.whatsapp_number_id)) {
      return true;
    }
    
    return false;
  }
  
  // Usuário padrão: só vê seus próprios dados
  return client.created_by_user_id === filters.userId;
};

import { useState } from 'react';