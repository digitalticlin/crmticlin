
import { DragDropContext } from "react-beautiful-dnd";
import { KanbanColumn as IKanbanColumn, KanbanLead } from "@/types/kanban";
import { useDragAndDrop } from "@/hooks/kanban/useDragAndDrop";
import { BoardContent } from "./kanban/BoardContent";
import { DropZones } from "./kanban/DropZones";
import { useEffect, useState } from "react";

interface KanbanBoardProps {
  columns: IKanbanColumn[];
  onColumnsChange: (newColumns: IKanbanColumn[]) => void;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onColumnUpdate: (updatedColumn: IKanbanColumn) => void;
  onColumnDelete: (columnId: string) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
}

export const KanbanBoard = ({
  columns,
  onColumnsChange,
  onOpenLeadDetail,
  onColumnUpdate,
  onColumnDelete,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false
}: KanbanBoardProps) => {
  const { 
    showDropZones, 
    isDragging,
    onDragStart, 
    onDragEnd 
  } = useDragAndDrop({ 
    columns, 
    onColumnsChange, 
    onMoveToWonLost, 
    isWonLostView 
  });
  
  // Add a class to the body when dragging to customize the cursor
  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('grabbing');
    } else {
      document.body.classList.remove('grabbing');
    }
    
    return () => {
      document.body.classList.remove('grabbing');
    };
  }, [isDragging]);

  return (
    <DragDropContext 
      onDragStart={onDragStart} 
      onDragEnd={onDragEnd}
    >
      <div className="relative w-full h-full flex flex-col">
        <BoardContent 
          columns={columns}
          onOpenLeadDetail={onOpenLeadDetail}
          onColumnUpdate={onColumnUpdate}
          onColumnDelete={onColumnDelete}
          onOpenChat={onOpenChat}
          onMoveToWonLost={!isWonLostView ? onMoveToWonLost : undefined}
          onReturnToFunnel={isWonLostView ? onReturnToFunnel : undefined}
          isWonLostView={isWonLostView}
          isDragging={isDragging}
        />
        
        {/* Fixed Won/Lost drop zones that appear during drag */}
        {!isWonLostView && <DropZones showDropZones={showDropZones} />}
      </div>
    </DragDropContext>
  );
};
