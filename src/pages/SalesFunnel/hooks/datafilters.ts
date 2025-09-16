/**
 * 🔒 DATAFILTERS ISOLADOS - PÁGINA SALESFUNNEL
 * Sistema de filtros 100% isolado com proteção multi-tenant obrigatória
 * CRÍTICO: Corrige vazamentos encontrados no sistema atual
 */

import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface SalesFunnelPageFilters {
  // 🔒 Identificação Multi-tenant (IMUTÁVEL)
  userId: string | null;
  companyId: string | null;
  createdByUserId: string | null; // CRÍTICO: Para admin
  role: 'admin' | 'operational' | 'user' | null;
  
  // 🎯 Filtros de Acesso Específicos
  ownerFilter: string | null; // Para operacionais
  whatsappInstancesFilter: string[] | null; // Instâncias permitidas
  assignedFunnelsFilter: string[] | null; // Funis atribuídos
  
  // 📊 Filtros de Visualização
  selectedFunnelId: string | null;
  selectedStages: string[];
  selectedTags: string[];
  searchQuery: string;
  dateRange: { from: Date | null; to: Date | null } | null;
  
  // 🎛️ Configurações do Kanban
  viewMode: 'kanban' | 'list' | 'table';
  groupBy: 'stage' | 'owner' | 'tag' | 'priority';
  sortBy: 'created_at' | 'updated_at' | 'name' | 'value';
  sortOrder: 'asc' | 'desc';
  
  // 🔧 Configurações de Performance
  pageSize: number;
  enableAutoRefresh: boolean;
  refreshInterval: number; // em segundos
  
  // 🔄 Estado
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

/**
 * Hook principal de filtros do SalesFunnel
 * ISOLADO: Zero dependências externas compartilhadas
 */
export const useSalesFunnelPageFilters = (): SalesFunnelPageFilters => {
  const { user } = useAuth();
  const [role, setRole] = useState<'admin' | 'operational' | 'user' | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [whatsappInstances, setWhatsappInstances] = useState<string[]>([]);
  const [assignedFunnels, setAssignedFunnels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔒 Carregar contexto de segurança do usuário
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    const loadSecurityContext = async () => {
      try {
        setLoading(true);
        
        // 1. Buscar perfil do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, company_id')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        setRole(profileData?.role as 'admin' | 'operational' | 'user' || null);
        setCompanyId(profileData?.company_id || null);
        
        // 2. Se operacional, buscar instâncias e funis atribuídos
        if (profileData?.role === 'operational') {
          // Buscar instâncias WhatsApp atribuídas
          const { data: instancesData } = await supabase
            .from('user_whatsapp_instances')
            .select('whatsapp_instance_id')
            .eq('user_id', user.id);
          
          const instanceIds = instancesData?.map(i => i.whatsapp_instance_id) || [];
          setWhatsappInstances(instanceIds);
          
          // Buscar funis atribuídos
          const { data: funnelsData } = await supabase
            .from('user_funnels')
            .select('funnel_id')
            .eq('user_id', user.id);
          
          const funnelIds = funnelsData?.map(f => f.funnel_id) || [];
          setAssignedFunnels(funnelIds);
          
          console.log('[SalesFunnel Filters] 🎯 Operacional carregado:', {
            instances: instanceIds.length,
            funnels: funnelIds.length
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('[SalesFunnel Filters] Erro ao carregar contexto:', err);
        setError('Erro ao carregar permissões do funil');
      } finally {
        setLoading(false);
      }
    };
    
    loadSecurityContext();
  }, [user?.id]);
  
  // 🔒 Determinar filtro multi-tenant
  const getMultiTenantFilter = (): string | null => {
    if (!user?.id || !role) return null;
    
    // Admin: vê apenas leads que criou
    if (role === 'admin') {
      return user.id;
    }
    
    // Operacional: não tem created_by_user_id próprio
    return null;
  };
  
  return {
    // 🔒 Multi-tenant (IMUTÁVEL)
    userId: user?.id || null,
    companyId,
    createdByUserId: getMultiTenantFilter(),
    role,
    
    // 🎯 Filtros de Acesso
    ownerFilter: role === 'operational' ? user?.id || null : null,
    whatsappInstancesFilter: role === 'operational' ? whatsappInstances : null,
    assignedFunnelsFilter: role === 'operational' ? assignedFunnels : null,
    
    // 📊 Filtros de UI (padrões)
    selectedFunnelId: null,
    selectedStages: [],
    selectedTags: [],
    searchQuery: '',
    dateRange: null,
    
    // 🎛️ Configurações Kanban
    viewMode: 'kanban',
    groupBy: 'stage',
    sortBy: 'created_at',
    sortOrder: 'desc',
    
    // 🔧 Performance
    pageSize: 50,
    enableAutoRefresh: true,
    refreshInterval: 30,
    
    // 🔄 Estado
    loading,
    error,
    lastRefresh: null
  };
};

/**
 * Hook para gerenciar estado local dos filtros
 */
export const useSalesFunnelFilterState = () => {
  const baseFilters = useSalesFunnelPageFilters();
  const [localFilters, setLocalFilters] = useState<Partial<SalesFunnelPageFilters>>({
    viewMode: 'kanban',
    groupBy: 'stage',
    sortBy: 'created_at',
    sortOrder: 'desc',
    pageSize: 50,
    enableAutoRefresh: true
  });
  
  // Merge seguro: NUNCA sobrescrever campos de segurança
  const filters: SalesFunnelPageFilters = {
    ...baseFilters,
    ...localFilters,
    // 🔒 FORÇAR campos de segurança (IMUTÁVEL)
    userId: baseFilters.userId,
    companyId: baseFilters.companyId,
    createdByUserId: baseFilters.createdByUserId,
    role: baseFilters.role,
    ownerFilter: baseFilters.ownerFilter,
    whatsappInstancesFilter: baseFilters.whatsappInstancesFilter,
    assignedFunnelsFilter: baseFilters.assignedFunnelsFilter,
    loading: baseFilters.loading,
    error: baseFilters.error
  };
  
  // Atualizar apenas campos seguros
  const updateFilters = (updates: Partial<SalesFunnelPageFilters>) => {
    const {
      // Remover campos de segurança
      userId, companyId, createdByUserId, role,
      ownerFilter, whatsappInstancesFilter, assignedFunnelsFilter,
      loading, error,
      // Pegar apenas campos permitidos
      ...safeUpdates
    } = updates;
    
    setLocalFilters(prev => ({
      ...prev,
      ...safeUpdates,
      lastRefresh: new Date()
    }));
  };
  
  const resetFilters = () => {
    setLocalFilters({
      selectedFunnelId: null,
      selectedStages: [],
      selectedTags: [],
      searchQuery: '',
      dateRange: null,
      viewMode: 'kanban',
      groupBy: 'stage',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };
  
  return {
    filters,
    updateFilters,
    resetFilters,
    isFiltered: Object.keys(localFilters).length > 0
  };
};

/**
 * 🔒 Validador de acesso a leads do funil
 */
export const validateLeadAccess = (
  lead: any,
  filters: SalesFunnelPageFilters
): boolean => {
  if (!filters.userId || !filters.role) return false;
  
  // Admin: só vê leads que criou
  if (filters.role === 'admin') {
    return lead.created_by_user_id === filters.createdByUserId;
  }
  
  // Operacional: vê leads atribuídos
  if (filters.role === 'operational') {
    // Por owner_id
    if (filters.ownerFilter && lead.owner_id === filters.ownerFilter) {
      return true;
    }
    
    // Por instância WhatsApp
    if (filters.whatsappInstancesFilter?.includes(lead.whatsapp_number_id)) {
      return true;
    }
    
    // Por funil atribuído
    if (filters.assignedFunnelsFilter?.includes(lead.funnel_id)) {
      return true;
    }
    
    return false;
  }
  
  // Usuário padrão: apenas seus dados
  return lead.created_by_user_id === filters.userId;
};

/**
 * 🔒 Validador de acesso a estágios do kanban
 */
export const validateStageAccess = (
  stage: any,
  filters: SalesFunnelPageFilters
): boolean => {
  if (!filters.userId || !filters.role) return false;
  
  // Admin: só vê estágios que criou
  if (filters.role === 'admin') {
    return stage.created_by_user_id === filters.createdByUserId;
  }
  
  // Operacional: vê estágios dos funis atribuídos
  if (filters.role === 'operational') {
    return filters.assignedFunnelsFilter?.includes(stage.funnel_id) || false;
  }
  
  // Usuário padrão: apenas seus estágios
  return stage.created_by_user_id === filters.userId;
};

/**
 * 🔒 Construtor de query segura para leads
 */
export const buildSecureLeadsQuery = (
  filters: SalesFunnelPageFilters
) => {
  let query = supabase
    .from('leads')
    .select(`
      *,
      lead_tags(
        tags(id, name, color)
      ),
      kanban_stage:kanban_stages(
        id, title, color, order_position
      )
    `);
  
  // 🔒 APLICAR FILTRO MULTI-TENANT OBRIGATÓRIO
  if (filters.role === 'admin' && filters.createdByUserId) {
    query = query.eq('created_by_user_id', filters.createdByUserId);
    console.log('[SalesFunnel Query] 👑 Admin filter aplicado');
    
  } else if (filters.role === 'operational') {
    // Construir filtros compostos para operacional
    const conditions = [];
    
    // Por owner_id
    if (filters.ownerFilter) {
      conditions.push(`owner_id.eq.${filters.ownerFilter}`);
    }
    
    // Por instâncias WhatsApp
    if (filters.whatsappInstancesFilter && filters.whatsappInstancesFilter.length > 0) {
      conditions.push(`whatsapp_number_id.in.(${filters.whatsappInstancesFilter.join(',')})`);
    }
    
    // Por funis atribuídos
    if (filters.assignedFunnelsFilter && filters.assignedFunnelsFilter.length > 0) {
      conditions.push(`funnel_id.in.(${filters.assignedFunnelsFilter.join(',')})`);
    }
    
    if (conditions.length > 0) {
      query = query.or(conditions.join(','));
      console.log('[SalesFunnel Query] 🎯 Filtros operacionais aplicados:', conditions.length);
    } else {
      console.warn('[SalesFunnel Query] ⚠️ Operacional sem atribuições - retornando vazio');
      // Força query que não retorna resultados
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  } else {
    console.warn('[SalesFunnel Query] ⚠️ Role não reconhecido - bloqueando acesso');
    query = query.eq('id', '00000000-0000-0000-0000-000000000000');
  }
  
  // Aplicar filtro de funil se selecionado
  if (filters.selectedFunnelId) {
    query = query.eq('funnel_id', filters.selectedFunnelId);
  }
  
  // Aplicar busca se houver
  if (filters.searchQuery) {
    const searchTerm = `%${filters.searchQuery}%`;
    query = query.or(
      `name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company.ilike.${searchTerm}`
    );
  }
  
  // Aplicar período se especificado
  if (filters.dateRange) {
    if (filters.dateRange.from) {
      query = query.gte('created_at', filters.dateRange.from.toISOString());
    }
    if (filters.dateRange.to) {
      query = query.lte('created_at', filters.dateRange.to.toISOString());
    }
  }
  
  // Aplicar ordenação
  query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
  
  return query;
};

/**
 * 🔒 Construtor de query segura para estágios
 */
export const buildSecureStagesQuery = (
  filters: SalesFunnelPageFilters
) => {
  let query = supabase
    .from('kanban_stages')
    .select('*')
    .order('order_position', { ascending: true });
  
  // 🔒 APLICAR FILTRO MULTI-TENANT OBRIGATÓRIO
  if (filters.role === 'admin' && filters.createdByUserId) {
    query = query.eq('created_by_user_id', filters.createdByUserId);
    console.log('[Stages Query] 👑 Admin filter aplicado');
    
  } else if (filters.role === 'operational' && filters.assignedFunnelsFilter) {
    if (filters.assignedFunnelsFilter.length > 0) {
      query = query.in('funnel_id', filters.assignedFunnelsFilter);
      console.log('[Stages Query] 🎯 Filtros operacionais aplicados');
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  } else {
    query = query.eq('id', '00000000-0000-0000-0000-000000000000');
  }
  
  // Filtro por funil específico se selecionado
  if (filters.selectedFunnelId) {
    query = query.eq('funnel_id', filters.selectedFunnelId);
  }
  
  return query;
};