
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import { Funnel } from '@/types/funnel';

interface SalesFunnelHeaderProps {
  funnels: Funnel[];
  selectedFunnel: Funnel | null;
  onFunnelChange: (funnel: Funnel) => void;
  onCreateFunnel: (name: string) => void;
  isLoading?: boolean;
}

export const SalesFunnelHeader: React.FC<SalesFunnelHeaderProps> = ({
  funnels,
  selectedFunnel,
  onFunnelChange,
  onCreateFunnel,
  isLoading = false
}) => {
  const handleCreateFunnel = () => {
    const name = prompt('Nome do novo funil:');
    if (name?.trim()) {
      onCreateFunnel(name.trim());
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Funil:</span>
      </div>
      
      <Select
        value={selectedFunnel?.id || ''}
        onValueChange={(value) => {
          const funnel = funnels.find(f => f.id === value);
          if (funnel) {
            onFunnelChange(funnel);
          }
        }}
        disabled={isLoading}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Selecionar funil..." />
        </SelectTrigger>
        <SelectContent>
          {funnels.map((funnel) => (
            <SelectItem key={funnel.id} value={funnel.id}>
              {funnel.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreateFunnel}
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        Novo Funil
      </Button>
    </div>
  );
};
