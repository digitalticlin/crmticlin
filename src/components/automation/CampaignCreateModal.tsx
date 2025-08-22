
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CampaignCreateModalProps {
  onSuccess?: () => void;
}

export const CampaignCreateModal = ({ onSuccess }: CampaignCreateModalProps) => {
  return (
    <Dialog open={false}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Campanha</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Modal de criação de campanha em desenvolvimento...</p>
          {onSuccess && (
            <button onClick={onSuccess} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
              Criar Campanha
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
