import React, { useRef, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DndDraggableCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  data?: Record<string, any>;
  onClick?: () => void;
}

export const DndDraggableCard: React.FC<DndDraggableCardProps> = ({
  id,
  children,
  className,
  disabled = false,
  data,
  onClick
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
    active
  } = useDraggable({
    id,
    disabled,
    data
  });

  const isCurrentDrag = active?.id === id;
  const isBeingDragged = isDragging && isCurrentDrag;
  const isDragStarted = useRef(false);
  const mouseDownPos = useRef({ x: 0, y: 0 });

  // Transform para seguir o cursor (não aplicar quando é drag overlay)
  const style = transform && !isCurrentDrag ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragStarted.current = false;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragStarted.current) {
      const dx = e.clientX - mouseDownPos.current.x;
      const dy = e.clientY - mouseDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Se moveu mais de 5px, considerar como drag
      if (distance > 5) {
        isDragStarted.current = true;
      }
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Processar click imediatamente se não houve movimento
    if (onClick && !disabled && !isDragStarted.current) {
      console.log('[DndDraggableCard] 🖱️ Click detectado:', { id, isDragStarted: isDragStarted.current });
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  }, [onClick, disabled, id]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Base styles
        "dnd-draggable-card transition-all duration-200 ease-out",
        
        // Estados de drag
        isDragging && !isCurrentDrag && "drag-card--ghost",
        isCurrentDrag && "drag-card--dragging",
        
        // Ocultar card original quando sendo arrastado (drag overlay ativo)
        isBeingDragged && "opacity-0",
        
        // Visual feedback durante drag
        isCurrentDrag && !isBeingDragged && "cursor-grabbing",
        !disabled && !isDragging && "cursor-grab",
        
        // Estado disabled
        disabled && "opacity-50 cursor-not-allowed",
        
        className
      )}
      data-draggable-id={id}
      data-is-dragging={isDragging}
      data-is-current-drag={isCurrentDrag}
      // Event handlers para drag + click
      {...listeners}
      {...attributes}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      <div className={cn(
        "relative w-full h-full group",
        
        // Efeitos visuais durante drag
        isCurrentDrag && [
          "shadow-2xl shadow-blue-500/25",
          "ring-2 ring-blue-400/50"
        ],
        
        // Card fantasma (original position)
        isDragging && !isCurrentDrag && [
          "opacity-40 scale-95"
        ]
      )}>
        {/* Card completo é arrastável */}
        <div className="w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
};