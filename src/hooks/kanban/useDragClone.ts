
import { useState } from 'react';
import { KanbanLead } from '@/types/kanban';

export interface CloneState {
  isVisible: boolean;
  lead: KanbanLead | null;
  position: { x: number; y: number };
}

export const useDragClone = () => {
  const [cloneState, setCloneState] = useState<CloneState>({
    isVisible: false,
    lead: null,
    position: { x: 0, y: 0 }
  });

  const showClone = (lead: KanbanLead, initialPosition: { x: number; y: number }) => {
    setCloneState({
      isVisible: true,
      lead,
      position: initialPosition
    });
  };

  const updateClonePosition = (x: number, y: number) => {
    setCloneState(prev => ({
      ...prev,
      position: { x, y }
    }));
  };

  const hideClone = () => {
    setCloneState({
      isVisible: false,
      lead: null,
      position: { x: 0, y: 0 }
    });
  };

  const resetClone = () => {
    hideClone();
  };

  return {
    cloneState,
    showClone,
    updateClonePosition,
    hideClone,
    resetClone
  };
};
