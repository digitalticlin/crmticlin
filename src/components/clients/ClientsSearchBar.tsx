
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { ClientData } from "@/hooks/clients/types";

export interface ClientsSearchBarProps {
  searchTerm: string;
  onSearchChange: (query: string) => void;
  clients: ClientData[];
  filteredClients: ClientData[];
  totalClientsCount: number;
  hasMoreClients: boolean;
}

export const ClientsSearchBar = ({
  searchTerm,
  onSearchChange,
  clients,
  filteredClients,
  totalClientsCount,
  hasMoreClients
}: ClientsSearchBarProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleClearSearch = () => {
    onSearchChange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleClearSearch}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="min-w-[120px]"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        {searchTerm ? (
          <span>
            Mostrando {filteredClients.length} de {totalClientsCount} leads
            {hasMoreClients && " (carregando mais...)"}
          </span>
        ) : (
          <span>
            Total: {totalClientsCount} leads
            {hasMoreClients && " (carregando mais...)"}
          </span>
        )}
      </div>
    </div>
  );
};
