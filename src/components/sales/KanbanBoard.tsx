
import React from 'react';
import { KanbanColumn, KanbanLead } from '@/types/kanban';
import { BoardContentOptimized } from './kanban/BoardContentOptimized';

export interface MassSelectionReturn {
  selectedLeads: string[];
  isSelected: (leadId: string) => boolean;
  toggleSelection: (leadId: string) => void;
  selectAll: (leadIds: string[]) => void;
  clearSelection: () => void;
  selectMultiple: (leadIds: string[]) => void;
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnsChange?: (newColumns: KanbanColumn[]) => void;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => Promise<void>;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection?: MassSelectionReturn;
}

export const KanbanBoard = ({
  columns,
  onColumnsChange = () => {},
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  massSelection
}: KanbanBoardProps) => {
  return (
    <div className="flex-1 overflow-hidden">
      <BoardContentOptimized
        columns={columns}
        onOpenLeadDetail={onOpenLeadDetail}
        onOpenChat={onOpenChat}
        onMoveToWonLost={onMoveToWonLost}
        onReturnToFunnel={onReturnToFunnel}
        isWonLostView={isWonLostView}
        wonStageId={wonStageId}
        lostStageId={lostStageId}
        massSelection={massSelection || {
          selectedLeads: [],
          isSelected: () => false,
          toggleSelection: () => {},
          selectAll: () => {},
          clearSelection: () => {},
          selectMultiple: () => {}
        }}
      />
    </div>
  );
};
