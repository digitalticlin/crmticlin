
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CampaignCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CampaignCreateModal = ({ isOpen, onClose, onSuccess }: CampaignCreateModalProps) => {
  const handleCreateCampaign = () => {
    // Mock campaign creation
    console.log('Creating campaign...');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Campanha</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <p>Modal para criação de campanha</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCampaign}>
              Criar Campanha
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
