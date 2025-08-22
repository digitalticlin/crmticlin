
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CampaignCreateModalProps {
  onSuccess: () => void;
}

export const CampaignCreateModal = ({ onSuccess }: CampaignCreateModalProps) => {
  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Campanha</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Modal de criação de campanha</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
