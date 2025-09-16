/**
 * 🎯 TIPOS ISOLADOS - PÁGINA CLIENTS
 * Definições de tipos específicas da página, sem dependências externas
 */

export interface ClientTag {
  id: string;
  name: string;
  color: string;
}

export interface ClientData {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Identificação Multi-tenant
  created_by_user_id: string; // CRÍTICO: Sempre presente
  owner_id: string | null;
  whatsapp_number_id: string | null;
  
  // Dados básicos
  name: string;
  email: string | null;
  phone: string;
  company: string | null;
  position: string | null;
  
  // Localização
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  
  // Funil de vendas
  funnel_id: string | null;
  kanban_stage_id: string | null;
  
  // Metadados
  source: string | null;
  notes: string | null;
  tags?: ClientTag[];
  
  // Campos adicionais
  [key: string]: any;
}

export interface ClientsFilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedCompanies: string[];
  selectedStates: string[];
  selectedCities: string[];
  selectedCountries: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  responsibleUsers: string[];
  funnelIds: string[];
  funnelStages: string[];
}

export interface ClientsPageState {
  view: 'grid' | 'list' | 'kanban';
  selectedClient: string | null;
  isCreating: boolean;
  isEditing: boolean;
  isBulkMode: boolean;
  selectedClients: string[];
}