import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DndDropZoneProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const DndDropZone: React.FC<DndDropZoneProps> = ({
  id,
  children,
  className,
  disabled = false
}) => {
  const {
    isOver,
    setNodeRef,
    active
  } = useDroppable({
    id,
    disabled
  });

  const isDragActive = active !== null;
  const canDrop = isDragActive && !disabled;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Base styles
        "dnd-drop-zone relative transition-all duration-200 ease-in-out",
        "min-h-[200px] rounded-xl",
        
        // Estados de drop
        canDrop && [
          "drop-zone--active",
          isOver && "drop-zone--over"
        ],
        
        // Visual feedback
        isOver && !disabled && [
          "bg-blue-50/50 border-2 border-dashed border-blue-400/70",
          "shadow-lg shadow-blue-100/50"
        ],
        
        // Estado disabled
        disabled && "opacity-50 pointer-events-none",
        
        className
      )}
      data-drop-zone-id={id}
      data-drop-active={canDrop}
      data-drop-over={isOver}
    >
      {children}
      
      {/* Overlay visual para drop */}
      {isOver && !disabled && (
        <div className="absolute inset-0 pointer-events-none rounded-xl">
          {/* Indicador central */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg animate-pulse">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Solte aqui
            </div>
          </div>
          
          {/* Efeito de brilho */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 via-transparent to-blue-600/20 animate-pulse" />
        </div>
      )}
    </div>
  );
};