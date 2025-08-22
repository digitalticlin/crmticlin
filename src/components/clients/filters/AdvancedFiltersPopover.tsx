import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Filter, X, RotateCcw } from 'lucide-react';
import { FilterByTags } from './FilterByTags';
import { FilterByCompany } from './FilterByCompany';
import { FilterByUser } from './FilterByUser';
import { FilterByFunnelStage } from './FilterByFunnelStage';
import { FilterByDate } from './FilterByDate';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

interface AdvancedFiltersPopoverProps {
  children?: React.ReactNode;
}

export const AdvancedFiltersPopover = ({ children }: AdvancedFiltersPopoverProps) => {
  const {
    isOpen,
    setIsOpen,
    hasActiveFilters,
    activeFiltersCount,
    filterSummary,
    clearFilters,
    removeFilter,
    filterOptions,
    isLoadingOptions
  } = useAdvancedFilters();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button 
            variant="outline" 
            size="sm"
            className={`
              flex items-center gap-2 rounded-xl backdrop-blur-sm border-white/40 hover:bg-white/30
              ${hasActiveFilters 
                ? 'bg-blue-100/50 text-blue-800 border-blue-400/40' 
                : 'bg-white/20 text-gray-800'
              }
            `}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        )}
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0 max-h-[80vh] flex flex-col overflow-hidden" 
        align="start"
        side="bottom"
        sideOffset={8}
      >
        {/* Header Simplificado */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Resumo dos Filtros Ativos - Mais Compacto */}
          {hasActiveFilters && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {filterSummary.activeFilters.map((filter, index) => (
                  <Badge 
                    key={index}
                    variant="secondary" 
                    className="text-xs flex items-center gap-1"
                  >
                    <span className="truncate max-w-24">{filter.label}: {filter.value}</span>
                    <button
                      onClick={() => removeFilter(filter.type)}
                      className="hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filtros Simplificados */}
        <div className="overflow-y-auto flex-grow p-4">
          <div className="space-y-6">
            {/* 1. Tags */}
            <FilterByTags 
              tags={filterOptions?.tags || []}
              isLoading={isLoadingOptions}
            />

            {/* 2. Empresa */}
            <FilterByCompany 
              companies={filterOptions?.companies || []}
              isLoading={isLoadingOptions}
            />

            {/* 3. Data de Criação */}
            <FilterByDate />

            {/* 4. Usuário Responsável */}
            <FilterByUser 
              users={filterOptions?.responsibleUsers || []}
              isLoading={isLoadingOptions}
            />

            {/* 5. Etapas de Funil */}
            <FilterByFunnelStage 
              stages={filterOptions?.funnelStages || []}
              isLoading={isLoadingOptions}
            />
          </div>
        </div>

        {/* Footer Simplificado */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
            </span>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};