
import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { KanbanColumn, KanbanLead } from '@/types/kanban';
import { ColumnHeader } from './ColumnHeader';
import { LeadCard } from '../lead/LeadCard';
import { useDragClone } from '@/hooks/kanban/useDragClone';
import { EmptyFunnel } from './EmptyFunnel';
import { WonLostFunnel } from './WonLostFunnel';
import { Card } from '@/components/ui/card';

interface BoardContentOptimizedProps {
  selectedFunnelId: string;
  columns: KanbanColumn[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: KanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onMoveLeadToStage: (leadId: string, targetStageId: string) => void;
  isWonLostView: boolean;
  wonStageId: string;
  lostStageId: string;
}

export const BoardContentOptimized: React.FC<BoardContentOptimizedProps> = ({
  selectedFunnelId,
  columns,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onMoveLeadToStage,
  isWonLostView,
  wonStageId,
  lostStageId
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const { cloneState, showClone, updateClonePosition, hideClone } = useDragClone();

  // Handle empty states
  if (!selectedFunnelId) {
    return <EmptyFunnel />;
  }

  if (isWonLostView) {
    return <WonLostFunnel />;
  }

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, lead: KanbanLead) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    showClone(lead, { x: e.clientX, y: e.clientY });
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateClonePosition(moveEvent.clientX - offsetX, moveEvent.clientY - offsetY);
    };
    
    const handlePointerUp = () => {
      hideClone();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [showClone, updateClonePosition, hideClone]);

  const handleDrop = useCallback((e: React.DragEvent, targetColumn: KanbanColumn) => {
    e.preventDefault();
    
    try {
      const leadData = e.dataTransfer.getData('application/json');
      const lead: KanbanLead = JSON.parse(leadData);
      
      if (lead && targetColumn.id !== lead.columnId) {
        onMoveLeadToStage(lead.id, targetColumn.id);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [onMoveLeadToStage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div ref={boardRef} className="flex-1 overflow-auto">
      <div className="flex gap-6 p-6 min-h-full">
        {columns.map((column) => (
          <Card
            key={column.id}
            className="flex-shrink-0 w-80 bg-white/50 backdrop-blur-sm border border-white/20 shadow-xl"
            onDrop={(e) => handleDrop(e, column)}
            onDragOver={handleDragOver}
          >
            <div className="p-4">
              <ColumnHeader
                column={column}
                isHovered={false}
                canEdit={true}
                onUpdate={onColumnUpdate}
                onDelete={onColumnDelete}
              />
              
              <div className="mt-4 space-y-3">
                {column.leads?.map((lead) => (
                  <div
                    key={lead.id}
                    onPointerDown={(e) => handlePointerDown(e, lead)}
                    style={{ touchAction: 'none' }}
                  >
                    <LeadCard
                      lead={lead}
                      onClick={() => onOpenLeadDetail(lead)}
                      isWonLostView={isWonLostView}
                    />
                  </div>
                ))}
                
                {(!column.leads || column.leads.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum lead nesta etapa
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Clone overlay */}
      {cloneState.isVisible && cloneState.lead && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: cloneState.position.x,
            top: cloneState.position.y,
          }}
        >
          <div className="opacity-80 scale-95">
            <LeadCard
              lead={cloneState.lead}
              onClick={() => {}}
              isWonLostView={isWonLostView}
            />
          </div>
        </div>
      )}
    </div>
  );
};
