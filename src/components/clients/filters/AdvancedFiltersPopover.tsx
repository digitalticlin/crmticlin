
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Calendar } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FilterState {
  tags: string[];
  funnelStage: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  source: string;
  value: {
    min?: number;
    max?: number;
  };
}

interface AdvancedFiltersPopoverProps {
  onFiltersChange: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export const AdvancedFiltersPopover = ({
  onFiltersChange,
  currentFilters
}: AdvancedFiltersPopoverProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      tags: [],
      funnelStage: '',
      dateRange: {},
      source: '',
      value: {}
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setIsOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = localFilters.tags.filter(tag => tag !== tagToRemove);
    updateFilter('tags', newTags);
  };

  const hasActiveFilters = () => {
    return localFilters.tags.length > 0 ||
           localFilters.funnelStage ||
           localFilters.source ||
           localFilters.value.min !== undefined ||
           localFilters.value.max !== undefined ||
           localFilters.dateRange.from ||
           localFilters.dateRange.to;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`gap-2 ${hasActiveFilters() ? 'border-blue-500 bg-blue-50' : ''}`}
        >
          <Filter className="h-4 w-4" />
          Filtros Avançados
          {hasActiveFilters() && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {localFilters.tags.length + 
               (localFilters.funnelStage ? 1 : 0) + 
               (localFilters.source ? 1 : 0) +
               (localFilters.value.min !== undefined || localFilters.value.max !== undefined ? 1 : 0) +
               (localFilters.dateRange.from || localFilters.dateRange.to ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtros Avançados</h4>
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Limpar todos
              </Button>
            )}
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1">
              {localFilters.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-red-100"
                  onClick={() => removeTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Adicionar tag..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && !localFilters.tags.includes(value)) {
                    updateFilter('tags', [...localFilters.tags, value]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>

          {/* Funnel Stage Filter */}
          <div className="space-y-2">
            <Label>Etapa do Funil</Label>
            <Select
              value={localFilters.funnelStage}
              onValueChange={(value) => updateFilter('funnelStage', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as etapas</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="proposal">Proposta</SelectItem>
                <SelectItem value="negotiation">Negociação</SelectItem>
                <SelectItem value="won">Ganho</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="space-y-2">
            <Label>Origem</Label>
            <Select
              value={localFilters.source}
              onValueChange={(value) => updateFilter('source', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as origens</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="website">Site</SelectItem>
                <SelectItem value="social">Redes Sociais</SelectItem>
                <SelectItem value="referral">Indicação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value Range Filter */}
          <div className="space-y-2">
            <Label>Valor do Negócio</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Mín"
                value={localFilters.value.min || ''}
                onChange={(e) => updateFilter('value', {
                  ...localFilters.value,
                  min: e.target.value ? Number(e.target.value) : undefined
                })}
              />
              <Input
                type="number"
                placeholder="Máx"
                value={localFilters.value.max || ''}
                onChange={(e) => updateFilter('value', {
                  ...localFilters.value,
                  max: e.target.value ? Number(e.target.value) : undefined
                })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button onClick={applyFilters} className="flex-1">
              Aplicar Filtros
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
