/**
 * 🎯 TIPOS COMPARTILHADOS ENTRE MÓDULOS
 *
 * Define interfaces e tipos usados por todos os módulos
 * para garantir consistência e type-safety
 */

import { KanbanColumn, KanbanLead } from '@/types/kanban';

// Estado compartilhado entre módulos
export interface SharedFunnelState {
  funnelId: string | null;
  columns: KanbanColumn[];
  allLeads: KanbanLead[];
  userId: string;
  userRole: string;
  tenantId?: string;
}

// Eventos que podem ser emitidos entre módulos
export type FunnelEvent =
  | { type: 'DATA_LOADED'; payload: { columns: KanbanColumn[]; leads: KanbanLead[] } }
  | { type: 'LEAD_MOVED'; payload: { leadId: string; fromStage: string; toStage: string } }
  | { type: 'FILTER_APPLIED'; payload: FilterOptions }
  | { type: 'SELECTION_CHANGED'; payload: { selectedIds: Set<string> } }
  | { type: 'REALTIME_UPDATE'; payload: any }
  | { type: 'REFRESH_REQUEST'; payload?: void }
  | { type: 'ERROR'; payload: { module: string; error: Error } };

// Opções de filtro
export interface FilterOptions {
  searchTerm?: string;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  valueRange?: { min: number; max: number };
  assignedUser?: string;
  status?: 'active' | 'won' | 'lost';
}

// Configuração de módulo
export interface ModuleConfig {
  enabled: boolean;
  tenantAware: boolean;
  roleBasedAccess: boolean;
}

// Interface base para módulos
export interface FunnelModule {
  name: string;
  initialize: (state: SharedFunnelState, config: ModuleConfig) => void;
  cleanup: () => void;
  handleEvent?: (event: FunnelEvent) => void;
}

// Callbacks para comunicação entre módulos
export interface ModuleCallbacks {
  onStateChange: (updater: (state: SharedFunnelState) => SharedFunnelState) => void;
  emitEvent: (event: FunnelEvent) => void;
  getState: () => SharedFunnelState;
}