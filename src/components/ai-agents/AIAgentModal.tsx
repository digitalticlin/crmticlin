
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIAgent } from '@/types/aiAgent';
import { AIAgentForm } from './AIAgentForm';

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: AIAgent | null;
  onSave: () => void;
}

export const AIAgentModal: React.FC<AIAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  onSave
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {agent ? 'Editar Agente' : 'Criar Novo Agente'}
          </DialogTitle>
        </DialogHeader>
        <AIAgentForm onSuccess={onSave} />
      </DialogContent>
    </Dialog>
  );
};
