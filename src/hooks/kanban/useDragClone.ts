
import { useState, useCallback, useEffect, useRef } from "react";
import { KanbanLead } from "@/types/kanban";

interface CloneState {
  isVisible: boolean;
  lead: KanbanLead | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export const useDragClone = () => {
  const [cloneState, setCloneState] = useState<CloneState>({
    isVisible: false,
    lead: null,
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 }
  });

  // Offset entre o cursor e o canto superior esquerdo do card
  const hasOffsetRef = useRef(false);
  const cursorOffsetRef = useRef({ x: 0, y: 0 });

  const showClone = useCallback((
    lead: KanbanLead,
    initialPosition: { x: number; y: number },
    size: { width: number; height: number },
    initialOffset?: { x: number; y: number }
  ) => {
    console.log('[DragClone] 🎯 Mostrando clone para:', lead.name);
    setCloneState({
      isVisible: true,
      lead,
      position: initialPosition,
      size
    });
    if (initialOffset) {
      cursorOffsetRef.current = initialOffset;
      hasOffsetRef.current = true;
    } else {
      hasOffsetRef.current = false;
    }
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
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 }
    });
    hasOffsetRef.current = false;
  }, []);

  // Listener global otimizado para movimento do mouse
  useEffect(() => {
    if (!cloneState.isVisible) return;

    let animationId: number;
    const handleMouseMove = (e: MouseEvent) => {
      // Usar requestAnimationFrame para suavizar atualizações
      cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(() => {
        // Na primeira leitura, definimos o offset entre o cursor e o card
        if (!hasOffsetRef.current) {
          // Primeiro cálculo: âncora exatamente onde o usuário clicou,
          // porém sempre DENTRO do card (clamp para evitar âncora fora).
          const rawX = e.clientX - cloneState.position.x;
          const rawY = e.clientY - cloneState.position.y;
          const width = cloneState.size.width || 0;
          const height = cloneState.size.height || 0;
          const padding = 0; // manter exatamente no ponto clicado, mas ainda dentro do card
          const maxX = width > 0 ? Math.max(padding, width - padding) : rawX;
          const maxY = height > 0 ? Math.max(padding, height - padding) : rawY;
          const clampedX = width > 0 ? Math.min(Math.max(rawX, padding), maxX) : rawX;
          const clampedY = height > 0 ? Math.min(Math.max(rawY, padding), maxY) : rawY;
          cursorOffsetRef.current = { x: clampedX, y: clampedY };
          hasOffsetRef.current = true;
        }

        const nextX = e.clientX - cursorOffsetRef.current.x;
        const nextY = e.clientY - cursorOffsetRef.current.y;
        updateClonePosition(nextX, nextY);
      });
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, [
    cloneState.isVisible,
    cloneState.position.x,
    cloneState.position.y,
    cloneState.size.width,
    cloneState.size.height,
    updateClonePosition
  ]);

  return {
    cloneState,
    showClone,
    updateClonePosition,
    hideClone
  };
};
