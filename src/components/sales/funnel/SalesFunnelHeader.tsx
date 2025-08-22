
import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter, Settings } from 'lucide-react';
import { MassSelectionReturn } from '@/components/sales/KanbanBoard';
import { KanbanLead } from '@/types/kanban';

interface SalesFunnelHeaderProps {
  funnelName: string;
  onFiltersClick: () => void;
  onMassActionsClick: () => void;
  massSelection: MassSelectionReturn;
  allLeads: KanbanLead[];
}

export const SalesFunnelHeader = ({
  funnelName,
  onFiltersClick,
  onMassActionsClick,
  massSelection,
  allLeads
}: SalesFunnelHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h2 className="text-xl font-semibold">{funnelName}</h2>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onFiltersClick}>
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
        <Button variant="outline" onClick={onMassActionsClick}>
          <Settings className="h-4 w-4 mr-2" />
          Ações ({massSelection.selectedLeads.length})
        </Button>
      </div>
    </div>
  );
};
