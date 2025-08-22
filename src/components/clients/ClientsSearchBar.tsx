import React, { useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { AdvancedFiltersPopover } from './filters/AdvancedFiltersPopover';

interface ClientsSearchBarProps {
  onSearch: (term: string) => void;
  onFiltersChange: (filters: any) => void;
}

export const ClientsSearchBar = ({ onSearch, onFiltersChange }: ClientsSearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  }, [onSearch]);

  const defaultFilters = {
    tags: [],
    funnelStage: '',
    dateRange: { from: undefined, to: undefined },
    source: '',
    value: { min: 0, max: 0 }
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <Input
        type="text"
        placeholder="Buscar clientes..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="flex-grow"
      />
      
      <AdvancedFiltersPopover 
        onFiltersChange={onFiltersChange || (() => {})}
        currentFilters={defaultFilters}
      />
    </div>
  );
};
