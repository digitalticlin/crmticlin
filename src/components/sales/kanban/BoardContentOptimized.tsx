
import React from 'react';
import { KanbanColumn, KanbanLead } from '@/types/kanban';
import { MassSelectionReturn } from '../KanbanBoard';

// Mock components for missing imports
const LeadCard = ({ lead, onOpenLeadDetail }: { lead: KanbanLead; onOpenLeadDetail: (lead: KanbanLead) => void }) => (
  <div className="p-2 bg-white rounded shadow cursor-pointer" onClick={() => onOpenLeadDetail(lead)}>
    <h3 className="font-medium">{lead.name}</h3>
    <p className="text-sm text-gray-600">{lead.phone}</p>
  </div>
);

const ColumnHeader = ({ title, count }: { title: string; count: number }) => (
  <div className="p-3 border-b">
    <h3 className="font-semibold">{title} ({count})</h3>
  </div>
);

const DragCloneElement = () => null;

export interface BoardContentOptimizedProps {
  columns: KanbanColumn[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: "won" | "lost") => Promise<void>;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
  massSelection: MassSelectionReturn;
}

export const BoardContentOptimized = ({
  columns,
  onOpenLeadDetail,
  onOpenChat,
  onMoveToWonLost,
  onReturnToFunnel,
  isWonLostView = false,
  wonStageId,
  lostStageId,
  massSelection
}: BoardContentOptimizedProps) => {
  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80 bg-gray-50 rounded-lg">
          <ColumnHeader title={column.title} count={column.leads.length} />
          <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
            {column.leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onOpenLeadDetail={onOpenLeadDetail}
              />
            ))}
          </div>
        </div>
      ))}
      <DragCloneElement />
    </div>
  );
};
