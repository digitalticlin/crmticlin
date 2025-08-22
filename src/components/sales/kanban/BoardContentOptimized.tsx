
import React, { useRef, useCallback, useEffect } from 'react';
import { KanbanColumn as KanbanColumnType, KanbanLead } from '@/types/kanban';
import { KanbanColumnMemo } from '../KanbanColumnMemo';
import { useDragClone } from '@/hooks/kanban/useDragClone';
import { DragCloneLayer } from '../drag/DragCloneLayer';
import { PortalErrorBoundary } from '@/components/error/PortalErrorBoundary';
import { MassSelectionReturn } from '@/hooks/useMassSelection';

interface BoardContentOptimizedProps {
  columns: KanbanColumnType[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onUpdateColumn?: (column: KanbanColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionReturn;
}

export const BoardContentOptimized = ({
  columns,
  onOpenLeadDetail,
  onUpdateColumn,
  onDeleteColumn,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  massSelection
}: BoardContentOptimizedProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const { cloneState, startClone, updateClone, stopClone } = useDragClone();

  // Handle mouse move for drag clone
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (cloneState.isVisible) {
      updateClone({
        x: e.clientX - (cloneState.size?.width ? cloneState.size.width / 2 : 150),
        y: e.clientY - (cloneState.size?.height ? cloneState.size.height / 2 : 100)
      });
    }
  }, [cloneState.isVisible, cloneState.size, updateClone]);

  // Handle pointer down for drag clone
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Convert React PointerEvent to native PointerEvent properties
    const nativeEvent = {
      clientX: e.clientX,
      clientY: e.clientY,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      isPrimary: e.isPrimary,
      preventDefault: () => e.preventDefault(),
      stopPropagation: () => e.stopPropagation()
    } as PointerEvent;

    // Handle the converted event (implementation depends on your drag logic)
    console.log('[BoardContentOptimized] Pointer down:', nativeEvent);
  }, []);

  // Add/remove mouse move listener
  useEffect(() => {
    if (cloneState.isVisible) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [cloneState.isVisible, handleMouseMove]);

  // Card mouse enter/leave handlers
  const handleAnyCardMouseEnter = useCallback(() => {
    // Card hover logic if needed
  }, []);

  const handleAnyCardMouseLeave = useCallback(() => {
    // Card hover logic if needed
  }, []);

  return (
    <PortalErrorBoundary>
      <div 
        ref={boardRef}
        className="flex gap-6 h-full overflow-x-auto overflow-y-hidden"
        onPointerDown={handlePointerDown}
        style={{ 
          minWidth: 'fit-content',
          paddingBottom: '1rem' 
        }}
      >
        {columns.map((column, index) => (
          <KanbanColumnMemo
            key={column.id}
            column={column}
            index={index}
            onOpenLeadDetail={onOpenLeadDetail}
            onUpdateColumn={onUpdateColumn}
            onDeleteColumn={onDeleteColumn}
            onOpenChat={onOpenChat}
            onMoveToWonLost={onMoveToWonLost}
            onReturnToFunnel={onReturnToFunnel}
            isWonLostView={isWonLostView}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
            massSelection={massSelection}
          />
        ))}
        
        {/* Drag Clone Layer */}
        <DragCloneLayer cloneState={cloneState} />
      </div>
    </PortalErrorBoundary>
  );
};
