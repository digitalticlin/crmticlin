/**
 * 🔒 DATAFILTERS ISOLADOS - PÁGINA DASHBOARD
 * Sistema de filtros 100% isolado com proteção multi-tenant obrigatória
 * CRÍTICO: Todos os dados são filtrados por created_by_user_id
 */

import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardPageFilters {
  // 🔒 Identificação Multi-tenant (NUNCA pode ser alterado)
  userId: string | null;
  companyId: string | null;
  createdByUserId: string | null; // CRÍTICO: Base de todo filtro
  role: 'admin' | 'operational' | 'user' | null;
  
  // 🎯 Filtros de Acesso Específicos
  ownerFilter: string | null; // Para operacionais
  teamMembersFilter: string[] | null; // Time do admin
  whatsappInstancesFilter: string[] | null; // Instâncias permitidas
  
  // 📊 Filtros de Visualização (UI)
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  customDateRange: { from: Date | null; to: Date | null } | null;
  selectedFunnels: string[];
  selectedStages: string[];
  selectedTags: string[];
  
  // 🎛️ Configurações de Dashboard
  enabledKPIs: {
    revenue: boolean;
    conversion: boolean;
    leads: boolean;
    performance: boolean;
  };
  enabledCharts: string[];
  chartLayout: 'grid' | 'list' | 'custom';
  
  // 📈 Métricas e Agregações
  aggregationType: 'sum' | 'average' | 'count';
  groupBy: 'day' | 'week' | 'month' | null;
  
  // 🔄 Estado
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

/**
 * Hook principal de filtros do Dashboard
 * ISOLADO: Zero dependências externas compartilhadas
 */
export const useDashboardPageFilters = (): DashboardPageFilters => {
  const { user } = useAuth();
  const [role, setRole] = useState<'admin' | 'operational' | 'user' | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔒 Carregar dados de segurança do usuário
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    const loadUserSecurityContext = async () => {
      try {
        setLoading(true);
        
        // 1. Buscar role e company do usuário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, company_id')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        setRole(profileData?.role as 'admin' | 'operational' | 'user' || null);
        setCompanyId(profileData?.company_id || null);
        
        // 2. Se for admin, buscar membros do time
        if (profileData?.role === 'admin') {
          const { data: teamData } = await supabase
            .from('profiles')
            .select('id')
            .eq('created_by_user_id', user.id); // Admin vê quem ele criou
          
          setTeamMembers(teamData?.map(m => m.id) || []);
        }
        
        // 3. Se for operacional, buscar instâncias atribuídas
        if (profileData?.role === 'operational') {
          const { data: instancesData } = await supabase
            .from('user_whatsapp_instances')
            .select('whatsapp_instance_id')
            .eq('user_id', user.id);
          
          setWhatsappInstances(instancesData?.map(i => i.whatsapp_instance_id) || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('[Dashboard Filters] Erro ao carregar contexto:', err);
        setError('Erro ao carregar permissões');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserSecurityContext();
  }, [user?.id]);
  
  // 🔒 Determinar filtro multi-tenant baseado no role
  const getMultiTenantFilter = (): string | null => {
    if (!user?.id || !role) return null;
    
    // CRÍTICO: Admin SEMPRE vê apenas seus próprios dados
    if (role === 'admin') {
      return user.id; // Admin vê apenas o que criou
    }
    
    // Operacional não tem created_by_user_id próprio
    // Será filtrado por owner_id ou whatsapp_instances
    if (role === 'operational') {
      return null;
    }
    
    // Usuário padrão vê apenas seus dados
    return user.id;
  };
  
  return {
    // 🔒 Multi-tenant (IMUTÁVEL)
    userId: user?.id || null,
    companyId,
    createdByUserId: getMultiTenantFilter(),
    role,
    
    // 🎯 Filtros de Acesso
    ownerFilter: role === 'operational' ? user?.id || null : null,
    teamMembersFilter: role === 'admin' ? teamMembers : null,
    whatsappInstancesFilter: role === 'operational' ? whatsappInstances : null,
    
    // 📊 Filtros de UI (valores padrão)
    period: 'month',
    customDateRange: null,
    selectedFunnels: [],
    selectedStages: [],
    selectedTags: [],
    
    // 🎛️ Configurações
    enabledKPIs: {
      revenue: true,
      conversion: true,
      leads: true,
      performance: true
    },
    enabledCharts: ['revenue', 'conversion', 'funnel', 'performance'],
    chartLayout: 'grid',
    
    // 📈 Agregações
    aggregationType: 'sum',
    groupBy: 'day',
    
    // 🔄 Estado
    loading,
    error,
    lastRefresh: null
  };
};

/**
 * Hook para gerenciar estado local dos filtros de UI
 */
export const useDashboardFilterState = () => {
  const baseFilters = useDashboardPageFilters();
  const [localFilters, setLocalFilters] = useState<Partial<DashboardPageFilters>>({
    period: 'month',
    enabledKPIs: {
      revenue: true,
      conversion: true,
      leads: true,
      performance: true
    },
    enabledCharts: ['revenue', 'conversion', 'funnel', 'performance'],
    chartLayout: 'grid'
  });
  
  // Merge seguro: NUNCA sobrescrever campos de segurança
  const filters: DashboardPageFilters = {
    ...baseFilters,
    ...localFilters,
    // 🔒 FORÇAR campos de segurança
    userId: baseFilters.userId,
    companyId: baseFilters.companyId,
    createdByUserId: baseFilters.createdByUserId,
    role: baseFilters.role,
    ownerFilter: baseFilters.ownerFilter,
    teamMembersFilter: baseFilters.teamMembersFilter,
    whatsappInstancesFilter: baseFilters.whatsappInstancesFilter,
    loading: baseFilters.loading,
    error: baseFilters.error
  };
  
  // Atualizar apenas campos permitidos
  const updateFilters = (updates: Partial<DashboardPageFilters>) => {
    const {
      // Remover campos de segurança
      userId, companyId, createdByUserId, role,
      ownerFilter, teamMembersFilter, whatsappInstancesFilter,
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
      period: 'month',
      enabledKPIs: {
        revenue: true,
        conversion: true,
        leads: true,
        performance: true
      },
      enabledCharts: ['revenue', 'conversion', 'funnel', 'performance'],
      chartLayout: 'grid'
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
 * 🔒 Validador de acesso a dados do dashboard
 */
export const validateDashboardDataAccess = (
  record: any,
  filters: DashboardPageFilters
): boolean => {
  if (!filters.userId || !filters.role) return false;
  
  // Admin: só vê dados criados por ele
  if (filters.role === 'admin') {
    return record.created_by_user_id === filters.createdByUserId;
  }
  
  // Operacional: vê dados atribuídos
  if (filters.role === 'operational') {
    // Por owner_id
    if (filters.ownerFilter && record.owner_id === filters.ownerFilter) {
      return true;
    }
    
    // Por instância WhatsApp
    if (filters.whatsappInstancesFilter?.includes(record.whatsapp_number_id)) {
      return true;
    }
    
    // Por atribuição direta
    if (record.assigned_to === filters.userId) {
      return true;
    }
    
    return false;
  }
  
  // Usuário padrão: apenas seus dados
  return record.created_by_user_id === filters.userId;
};

/**
 * 🔒 Construtor de query base com filtros multi-tenant
 */
export const buildSecureDashboardQuery = (
  tableName: string,
  filters: DashboardPageFilters
) => {
  let query = supabase.from(tableName);
  
  // 🔒 APLICAR FILTRO MULTI-TENANT OBRIGATÓRIO
  if (filters.role === 'admin' && filters.createdByUserId) {
    query = query.eq('created_by_user_id', filters.createdByUserId);
    console.log(`[Dashboard Query] 👑 Admin filter applied on ${tableName}`);
    
  } else if (filters.role === 'operational') {
    // Operacional precisa de filtros compostos
    const conditions = [];
    
    if (filters.ownerFilter) {
      conditions.push(`owner_id.eq.${filters.ownerFilter}`);
    }
    
    if (filters.whatsappInstancesFilter && filters.whatsappInstancesFilter.length > 0) {
      conditions.push(`whatsapp_number_id.in.(${filters.whatsappInstancesFilter.join(',')})`);
    }
    
    if (conditions.length > 0) {
      query = query.or(conditions.join(','));
      console.log(`[Dashboard Query] 🎯 Operational filters applied on ${tableName}`);
    } else {
      console.warn(`[Dashboard Query] ⚠️ No filters for operational on ${tableName}`);
    }
  }
  
  // Aplicar período se especificado
  if (filters.period && filters.period !== 'custom') {
    const now = new Date();
    let startDate = new Date();
    
    switch (filters.period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    query = query.gte('created_at', startDate.toISOString());
  }
  
  // Aplicar range customizado
  if (filters.customDateRange) {
    if (filters.customDateRange.from) {
      query = query.gte('created_at', filters.customDateRange.from.toISOString());
    }
    if (filters.customDateRange.to) {
      query = query.lte('created_at', filters.customDateRange.to.toISOString());
    }
  }
  
  return query;
};