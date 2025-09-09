import React, { useCallback } from 'react';
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
  
  // Transform para seguir o cursor
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Handler para clique duplo
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // Se estiver sendo arrastado, não processar clique duplo
    if (isDragging || disabled) {
      return;
    }
    
    console.log('[DndDraggableCard] 🖱️💬 DUPLO CLIQUE - ABRINDO CHAT:', { id });
    
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  }, [isDragging, disabled, onClick, id]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        // Base styles
        "dnd-draggable-card transition-all duration-200 ease-out",
        
        // Estados de drag - card original fica invisível durante drag
        isDragging && isCurrentDrag && "opacity-0",
        !disabled && !isDragging && "cursor-pointer hover:scale-[1.02]",
        
        // Estado disabled
        disabled && "opacity-50 cursor-not-allowed",
        
        className
      )}
      data-draggable-id={id}
      data-is-dragging={isDragging}
      
      // Double click handler para abrir chat
      onDoubleClick={handleDoubleClick}
      
      // DnD attributes e listeners padrão
      {...attributes}
      {...listeners}
    >
      <div className="relative w-full h-full">
        {children}
      </div>
    </div>
  );
};