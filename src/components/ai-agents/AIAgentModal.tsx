
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AIAgent } from '@/types/aiAgent';

export interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AIAgent | null;
  onSave?: () => Promise<void>;
}

export const AIAgentModal = ({ isOpen, onClose, agent, onSave }: AIAgentModalProps) => {
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
              <p className="text-sm text-gray-600">Tipo: {agent.type}</p>
            </div>
          )}
          {onSave && (
            <button onClick={onSave} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
              Salvar
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
