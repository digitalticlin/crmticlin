
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIAgent } from '@/types/ai-agent';

export interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AIAgent | null;
}

export const AIAgentModal = ({ isOpen, onClose, agent }: AIAgentModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {agent ? 'Editar Agente' : 'Novo Agente'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Modal de configuração do agente de IA</p>
          {agent && (
            <div>
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="text-sm text-gray-600">{agent.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
