
import { useState, useCallback, useEffect } from "react";
import { KanbanLead } from "@/types/kanban";

interface CloneState {
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

  const showClone = useCallback((lead: KanbanLead, initialPosition: { x: number; y: number }) => {
    console.log('[DragClone] 🎯 Mostrando clone para:', lead.name);
    setCloneState({
      isVisible: true,
      lead,
      position: initialPosition
    });
  }, []);

  const updateClonePosition = useCallback((x: number, y: number) => {
    setCloneState(prev => ({
      ...prev,
      position: { x, y }
    }));
  }, []);

  const hideClone = useCallback(() => {
    console.log('[DragClone] 🎯 Ocultando clone');
    setCloneState({
      isVisible: false,
      lead: null,
      position: { x: 0, y: 0 }
    });
  }, []);

  // Listener global para movimento do mouse
  useEffect(() => {
    if (!cloneState.isVisible) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateClonePosition(e.clientX - 190, e.clientY - 80); // Offset para centralizar
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [cloneState.isVisible, updateClonePosition]);

  return {
    cloneState,
    showClone,
    updateClonePosition,
    hideClone
  };
};
