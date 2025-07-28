
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, EyeOff } from 'lucide-react';

interface SalesFunnelControlsProps {
  isWonLostView: boolean;
  onToggleWonLostView: (show: boolean) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddColumn: (title: string) => void;
  leadsCount: number;
  columnsCount: number;
}

export const SalesFunnelControls: React.FC<SalesFunnelControlsProps> = ({
  isWonLostView,
  onToggleWonLostView,
  searchTerm,
  onSearchChange,
  onAddColumn,
  leadsCount,
  columnsCount
}) => {
  const handleAddColumn = () => {
    const title = prompt('Nome da nova etapa:');
    if (title?.trim()) {
      onAddColumn(title.trim());
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {leadsCount} leads
          </Badge>
          <Badge variant="outline">
            {columnsCount} etapas
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleWonLostView(!isWonLostView)}
        >
          {isWonLostView ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Ocultar Ganhos/Perdas
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Ver Ganhos/Perdas
            </>
          )}
        </Button>
        
        <Button
          size="sm"
          onClick={handleAddColumn}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Etapa
        </Button>
      </div>
    </div>
  );
};
