import React, { useCallback } from 'react';
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
  // Handler simplificado para clique
  const handleClick = useCallback((e: React.MouseEvent) => {
    console.log('[DndDraggableCard] 🖱️ CLICK HANDLER CHAMADO:', { 
      id,
      disabled,
      hasOnClick: !!onClick,
      target: (e.target as HTMLElement).className
    });
    
    if (disabled) {
      console.log('[DndDraggableCard] 🚫 Disabled - ignorando click');
      return;
    }
    
    // Verificar se clicou em botões ou checkboxes
    const target = e.target as HTMLElement;
    const clickedOnButton = target.closest('button, .selection-checkbox, .lead-actions');
    
    if (clickedOnButton) {
      console.log('[DndDraggableCard] 🚫 Clicou em botão/checkbox - ignorando');
      return;
    }
    
    console.log('[DndDraggableCard] 💬 PROCESSANDO CLIQUE - CHAMANDO ONCLICK');
    
    if (onClick) {
      console.log('[DndDraggableCard] 🚀 EXECUTANDO ONCLICK...');
      e.preventDefault();
      e.stopPropagation();
      onClick();
      console.log('[DndDraggableCard] ✅ ONCLICK EXECUTADO');
    } else {
      console.log('[DndDraggableCard] ❌ ONCLICK NÃO EXISTE!');
    }
  }, [id, disabled, onClick]);

  return (
    <div
      className={cn(
        // Base styles
        "dnd-draggable-card transition-all duration-200 ease-out cursor-pointer hover:scale-[1.02]",
        
        // Estado disabled
        disabled && "opacity-50 cursor-not-allowed",
        
        className
      )}
      data-draggable-id={id}
      onClick={handleClick}
      onMouseDown={(e) => console.log('[DndDraggableCard] 🖱️ MOUSE DOWN detectado')}
      onMouseUp={(e) => console.log('[DndDraggableCard] 🖱️ MOUSE UP detectado')}
      style={{ 
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'auto'
      }}
    >
      <div className="relative w-full h-full" style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};