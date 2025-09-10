/**
 * 🎯 SISTEMA DE FILTROS ISOLADOS
 * Substitui o hook universal useDataFilters por hooks específicos de cada contexto
 */

import { useAuth } from "@/contexts/AuthContext";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useUserRole } from "@/hooks/useUserRole";

// ========================================
// 🏠 DASHBOARD FILTERS
// ========================================
export interface DashboardFilters {
  funnelsFilter: any[];
  kpisFilter: any;
  chartsFilter: any;
  periodFilter: any;
  role: string;
  userId: string | null;
  companyId: string | null;
  loading: boolean;
}

export const useDashboardFilters = (): DashboardFilters => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { data: companyData, loading: companyLoading } = useCompanyData();
  
  // Retornar filtros específicos do Dashboard
  return {
    funnelsFilter: [],
    kpisFilter: {
      showRevenue: true,
      showConversion: true, 
      showLeads: true,
      showPerformance: true
    },
    chartsFilter: {
      enabledCharts: ['revenue', 'conversion', 'leads', 'performance'],
      period: 'month'
    },
    periodFilter: {
      period: 'month',
      customRange: null
    },
    role: role || '',
    userId: user?.id || null,
    companyId: companyData?.id || null,
    loading: companyLoading
  };
};

// ========================================
// 🎯 SALES FUNNEL FILTERS
// ========================================
export interface SalesFunnelFilters {
  leadsFilter: any[];
  funnelsFilter: any[];
  stagesFilter: any[];
  tagsFilter: any[];
  role: string;
  userId: string | null;
  companyId: string | null;
  loading: boolean;
}

export const useSalesFunnelFilters = (): SalesFunnelFilters => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { data: companyData, loading: companyLoading } = useCompanyData();
  
  // Retornar filtros específicos do Sales Funnel
  return {
    leadsFilter: [],
    funnelsFilter: [],
    stagesFilter: [],
    tagsFilter: [],
    role: role || '',
    userId: user?.id || null,
    companyId: companyData?.id || null,
    loading: companyLoading
  };
};

// ========================================
// 💬 CHAT FILTERS
// ========================================
export interface ChatFilters {
  contactsFilter: any[];
  messagesFilter: any;
  conversationsFilter: any;
  statusFilter: any;
  role: string;
  userId: string | null;
  companyId: string | null;
  loading: boolean;
}

export const useChatFilters = (): ChatFilters => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { data: companyData, loading: companyLoading } = useCompanyData();
  
  // Retornar filtros específicos do Chat
  return {
    contactsFilter: [],
    messagesFilter: {
      unreadOnly: false,
      dateRange: null,
      searchQuery: ''
    },
    conversationsFilter: {
      status: 'all',
      priority: 'all'
    },
    statusFilter: {
      showOnline: true,
      showOffline: false
    },
    role: role || '',
    userId: user?.id || null,
    companyId: companyData?.id || null,
    loading: companyLoading
  };
};

// ========================================
// 🤖 AI AGENTS FILTERS
// ========================================
export interface AIAgentsFilters {
  agentsFilter: any[];
  promptsFilter: any;
  configFilter: any;
  analyticsFilter: any;
  role: string;
  userId: string | null;
  companyId: string | null;
  loading: boolean;
}

export const useAIAgentsFilters = (): AIAgentsFilters => {
  const { user } = useAuth();
  const { companyId } = useCompanyData();
  const { role, loading: roleLoading } = useUserRole();

  // Filtros específicos dos Agentes IA
  const aiAgentsSpecificLogic = {
    agentsFilter: [], // Agentes IA disponíveis
    promptsFilter: {
      status: 'all', // all, active, draft
      category: 'all',
      searchQuery: ''
    },
    configFilter: {
      showAdvanced: false,
      showDebug: role === 'admin'
    },
    analyticsFilter: {
      period: 'week',
      metrics: ['usage', 'performance', 'errors']
    }
  };

  return {
    ...aiAgentsSpecificLogic,
    role: role || 'user',
    userId: user?.id || null,
    companyId,
    loading: roleLoading
  };
};

// ========================================
// 👥 CLIENTS FILTERS
// ========================================
export interface ClientsFilters {
  listFilter: any[];
  detailsFilter: any;
  tagsFilter: any[];
  dealsFilter: any;
  importExportFilter: any;
  role: string;
  userId: string | null;
  companyId: string | null;
  loading: boolean;
}

export const useClientsFilters = (): ClientsFilters => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { data: companyData, loading: companyLoading } = useCompanyData();
  
  // Retornar filtros específicos dos Clients
  return {
    listFilter: [],
    detailsFilter: {
      showHistory: true,
      showDeals: true,
      showNotes: true
    },
    tagsFilter: [],
    dealsFilter: {
      status: 'all',
      dateRange: null
    },
    importExportFilter: {
      showJobs: true,
      showTemplates: role === 'admin'
    },
    role: role || '',
    userId: user?.id || null,
    companyId: companyData?.id || null,
    loading: companyLoading
  };
};

// ========================================
// 🔧 UTILITY FUNCTIONS
// ========================================

/**
 * Verifica se um filtro pertence a um contexto específico
 */
export const filterContextValidator = {
  belongsToDashboard: (filterKey: string): boolean => {
    const dashboardKeys = ['funnelsFilter', 'kpisFilter', 'chartsFilter', 'periodFilter'];
    return dashboardKeys.includes(filterKey);
  },

  belongsToSalesFunnel: (filterKey: string): boolean => {
    const salesFunnelKeys = ['leadsFilter', 'funnelsFilter', 'stagesFilter', 'tagsFilter'];
    return salesFunnelKeys.includes(filterKey);
  },

  belongsToChat: (filterKey: string): boolean => {
    const chatKeys = ['contactsFilter', 'messagesFilter', 'conversationsFilter', 'statusFilter'];
    return chatKeys.includes(filterKey);
  },

  belongsToAIAgents: (filterKey: string): boolean => {
    const aiAgentsKeys = ['agentsFilter', 'promptsFilter', 'configFilter', 'analyticsFilter'];
    return aiAgentsKeys.includes(filterKey);
  },

  belongsToClients: (filterKey: string): boolean => {
    const clientsKeys = ['listFilter', 'detailsFilter', 'tagsFilter', 'dealsFilter', 'importExportFilter'];
    return clientsKeys.includes(filterKey);
  }
};

/**
 * Debugging e migração - comparar com useDataFilters original
 */
export const filtersDebug = {
  /**
   * Compara os novos filtros isolados com o useDataFilters original
   */
  compareWithLegacy: (legacyFilters: any, newFilters: any, context: string) => {
    console.group(`🔍 [Filters Debug] Comparação ${context}`);
    
    console.log('Legacy filters:', legacyFilters);
    console.log('New isolated filters:', newFilters);
    
    // Verificar campos comuns
    const commonFields = ['role', 'userId', 'loading'];
    const comparison = {
      matched: 0,
      differences: [] as string[]
    };

    commonFields.forEach(field => {
      if (legacyFilters[field] === newFilters[field]) {
        comparison.matched++;
      } else {
        comparison.differences.push(`${field}: ${legacyFilters[field]} !== ${newFilters[field]}`);
      }
    });

    console.log('Comparison result:', comparison);
    console.groupEnd();
    
    return comparison;
  },

  /**
   * Log de uso de filtros por contexto
   */
  logFilterUsage: (context: string, filters: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [${context} Filters] Used:`, {
        timestamp: new Date().toISOString(),
        filters: Object.keys(filters),
        userId: filters.userId,
        role: filters.role,
        loading: filters.loading
      });
    }
  }
};

/**
 * Hook de compatibilidade para migração gradual
 * @deprecated Use hooks específicos de contexto
 */
export const useDataFiltersCompat = (context?: string) => {
  console.warn('🚨 [DEPRECATED] useDataFilters está sendo usado. Migre para:', {
    dashboard: 'useDashboardFilters',
    salesfunnel: 'useSalesFunnelFilters', 
    chat: 'useChatFilters',
    ai_agents: 'useAIAgentsFilters',
    clients: 'useClientsFilters'
  });

  // Fallback baseado no contexto
  switch (context?.toLowerCase()) {
    case 'dashboard':
      return useDashboardFilters();
    case 'salesfunnel':
    case 'sales_funnel':
      return useSalesFunnelFilters();
    case 'chat':
      return useChatFilters();
    case 'ai_agents':
    case 'aiagents':
      return useAIAgentsFilters();
    case 'clients':
      return useClientsFilters();
    default:
      // Fallback genérico - manter funcionalidade básica
      const { user } = useAuth();
      const { companyId } = useCompanyData();
      const { role, loading } = useUserRole();
      
      return {
        role: role || 'user',
        userId: user?.id || null,
        companyId,
        loading,
        // Campos legados vazios para não quebrar
        leadsFilter: [],
        funnelsFilter: [],
        stagesFilter: []
      };
  }
};