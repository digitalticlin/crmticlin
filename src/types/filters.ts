export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface ClientFilters {
  // Filtros solicitados
  tags: string[];
  companies: string[];
  responsibleUsers: string[];
  funnelStages: string[];
  dateRange?: DateRange;
  // Filtros antigos mantidos para compatibilidade
  funnelIds: string[];
  states: string[];
  cities: string[];
  countries: string[];
}

export interface FilterSummary {
  totalFilters: number;
  activeFilters: Array<{
    type: keyof ClientFilters;
    label: string;
    value: string;
  }>;
}

export interface FilterStats {
  totalClients: number;
  filteredClients: number;
  availableOptions: {
    tags: FilterOption[];
    responsibleUsers: FilterOption[];
    funnelIds: FilterOption[];
    funnelStages: FilterOption[];
    states: FilterOption[];
    cities: FilterOption[];
    countries: FilterOption[];
  };
}