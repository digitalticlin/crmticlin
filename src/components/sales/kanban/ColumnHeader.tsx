
import React from 'react';
import { KanbanColumn } from '@/types/kanban';

interface ColumnHeaderProps {
  column: KanbanColumn;
  isHovered: boolean;
  canEdit: boolean;
  onUpdate: (updatedColumn: KanbanColumn) => void;
  onDelete: (columnId: string) => void;
}

export const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  isHovered,
  canEdit,
  onUpdate,
  onDelete
}) => {
  return (
    <div className="flex items-center justify-between p-2">
      <h3 className="font-semibold text-gray-800">{column.title}</h3>
      <span className="text-sm text-gray-500">
        {column.leads?.length || 0}
      </span>
    </div>
  );
};
