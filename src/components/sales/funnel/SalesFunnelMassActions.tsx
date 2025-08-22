
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MassSelectionReturn } from '@/components/sales/KanbanBoard';
import { KanbanLead } from '@/types/kanban';

interface SalesFunnelMassActionsProps {
  isOpen: boolean;
  onClose: () => void;
  massSelection: MassSelectionReturn;
  allLeads: KanbanLead[];
}

export const SalesFunnelMassActions = ({ isOpen, onClose, massSelection, allLeads }: SalesFunnelMassActionsProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ações em Massa</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>{massSelection.selectedLeads.length} leads selecionados</p>
          <p>Ações em massa em desenvolvimento...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
