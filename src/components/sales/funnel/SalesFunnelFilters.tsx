
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SalesFunnelFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SalesFunnelFilters = ({ isOpen, onClose }: SalesFunnelFiltersProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Filtros do Funil</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Configurações de filtros em desenvolvimento...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
