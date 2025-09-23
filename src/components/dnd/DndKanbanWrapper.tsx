import React, { useCallback, useState, useRef, useEffect } from 'react';
import { DndContext, DragEndEvent, DragMoveEvent, DragOverlay, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors, closestCenter, rectIntersection } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DND_CONFIG } from '@/config/dndConfig';
import './dnd-kanban.css';

interface DndKanbanWrapperProps {
  children: React.ReactNode;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  dragOverlay?: React.ReactNode;
  className?: string;
}

// Usando configuração centralizada
const SCROLL_CONFIG = DND_CONFIG.scroll;

export const DndKanbanWrapper: React.FC<DndKanbanWrapperProps> = ({
  children,
  onDragStart,
  onDragOver,
  onDragEnd,
  dragOverlay,
  className
}) => {
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // 🚀 SENSORES ULTRA-RESPONSIVOS USANDO CONFIGURAÇÃO CENTRALIZADA
  const sensors = useSensors(
    useSensor(PointerSensor, DND_CONFIG.sensors)
  );

  DND_CONFIG.debug.log('info', 'DndKanbanWrapper configurado', {
    scrollConfig: SCROLL_CONFIG,
    sensorConfig: DND_CONFIG.sensors
  });

  // Auto-scroll horizontal durante drag
  const performScroll = useCallback(() => {
    if (!scrollContainerRef.current || !scrollDirection) return;

    const container = scrollContainerRef.current;
    const scrollAmount = scrollDirection === 'left' 
      ? -SCROLL_CONFIG.scrollSpeed 
      : SCROLL_CONFIG.scrollSpeed;

    container.scrollBy({
      left: scrollAmount,
      behavior: 'auto'
    });

    // Continuar scrolling enquanto necessário
    if (scrollDirection) {
      animationFrameRef.current = requestAnimationFrame(performScroll);
    }
  }, [scrollDirection]);

  // Detectar posição do mouse durante drag
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!isDragging) return;

    const clientX = (event.activatorEvent as any)?.clientX || 0;
    const viewport = window.innerWidth;

    let newDirection: 'left' | 'right' | null = null;

    // Scroll para esquerda
    if (clientX < SCROLL_CONFIG.triggerZone) {
      newDirection = 'left';
    } 
    // Scroll para direita
    else if (clientX > viewport - SCROLL_CONFIG.triggerZone) {
      newDirection = 'right';
    }

    // Só atualizar se mudou a direção
    if (newDirection !== scrollDirection) {
      setScrollDirection(newDirection);
    }
  }, [isDragging, scrollDirection]);

  // Iniciar auto-scroll quando direção muda
  useEffect(() => {
    if (scrollDirection && isDragging) {
      animationFrameRef.current = requestAnimationFrame(performScroll);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scrollDirection, isDragging, performScroll]);

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(event);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    setScrollDirection(null);
    
    // Cancelar qualquer animação pendente
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    onDragEnd(event);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={onDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={scrollContainerRef}
        className={cn(
          // Base styles
          "kanban-dnd-container relative overflow-x-auto",
          "scroll-smooth scrollbar-thin scrollbar-track-transparent",
          
          // Visual feedback durante scroll
          scrollDirection === 'left' && "scroll-indicator--left",
          scrollDirection === 'right' && "scroll-indicator--right",
          
          // Estado de dragging
          isDragging && "kanban--dragging",
          
          className
        )}
        data-kanban-board
      >
        {children}
        
        {/* Indicadores visuais de scroll */}
        {isDragging && scrollDirection && (
          <div className={cn(
            "fixed top-1/2 transform -translate-y-1/2 z-50",
            "text-2xl text-blue-500 animate-pulse",
            scrollDirection === 'left' ? "left-4" : "right-4"
          )}>
            {scrollDirection === 'left' ? '←' : '→'}
          </div>
        )}
      </div>
      
      <DragOverlay
        dropAnimation={DND_CONFIG.animations.dragOverlay}
        style={{
          cursor: 'grabbing'
        }}
      >
        {dragOverlay}
      </DragOverlay>
    </DndContext>
  );
};