
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

  // Listener global otimizado para movimento do mouse
  useEffect(() => {
    if (!cloneState.isVisible) return;

    let animationId: number;
    const handleMouseMove = (e: MouseEvent) => {
      // Usar requestAnimationFrame para suavizar atualizações
      cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(() => {
        updateClonePosition(e.clientX - 190, e.clientY - 80);
      });
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [cloneState.isVisible, updateClonePosition]);

  return {
    cloneState,
    showClone,
    updateClonePosition,
    hideClone
  };
};
