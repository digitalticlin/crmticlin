
import React, { useRef, useCallback } from 'react';
import { KanbanColumn, KanbanLead } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface LeadCardProps {
  lead: KanbanLead;
  onClick: () => void;
  onUpdate: (updates: Partial<KanbanLead>) => void;
  onDelete: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  showCheckbox?: boolean;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick }) => (
  <div 
    className="p-3 bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    onClick={onClick}
  >
    <h4 className="font-medium text-sm">{lead.name}</h4>
    <p className="text-xs text-gray-600">{lead.phone}</p>
    {lead.email && <p className="text-xs text-gray-600">{lead.email}</p>}
  </div>
);

interface ColumnHeaderProps {
  column: KanbanColumn;
  totalLeads: number;
  filteredCount: number;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({ column, filteredCount }) => (
  <div className="p-4 border-b">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-sm">{column.title}</h3>
      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
        {filteredCount}
      </span>
    </div>
  </div>
);

export interface BoardContentOptimizedProps {
  columns: KanbanColumn[];
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onLeadUpdate: (leadId: string, updates: Partial<KanbanLead>) => void;
  onLeadDelete: (leadId: string) => void;
  onStageChange: (leadId: string, newStageId: string, oldStageId: string) => void;
  searchQuery: string;
  massSelection: any;
}

export const BoardContentOptimized: React.FC<BoardContentOptimizedProps> = ({
  columns,
  onOpenLeadDetail,
  onLeadUpdate,
  onLeadDelete,
  onStageChange,
  searchQuery,
  massSelection
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    // Mock scroll handling
  }, []);

  const filteredColumns = columns.map(column => ({
    ...column,
    leads: column.leads.filter(lead => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query)
      );
    })
  }));

  return (
    <div 
      ref={containerRef}
      className="flex gap-6 h-full overflow-x-auto pb-4"
      onScroll={handleScroll}
    >
      {filteredColumns.map((column) => (
        <div
          key={column.id}
          className="flex flex-col min-w-80 bg-background border rounded-lg shadow-sm"
        >
          <ColumnHeader 
            column={column}
            totalLeads={column.leads.length}
            filteredCount={column.leads.filter(lead => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              return (
                lead.name?.toLowerCase().includes(query) ||
                lead.email?.toLowerCase().includes(query) ||
                lead.phone?.toLowerCase().includes(query)
              );
            }).length}
          />
          
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {column.leads
              .filter(lead => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  lead.name?.toLowerCase().includes(query) ||
                  lead.email?.toLowerCase().includes(query) ||
                  lead.phone?.toLowerCase().includes(query)
                );
              })
              .map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onOpenLeadDetail(lead)}
                  onUpdate={(updates) => onLeadUpdate(lead.id, updates)}
                  onDelete={() => onLeadDelete(lead.id)}
                  isSelected={massSelection.selectedLeads.includes(lead.id)}
                  onSelectionChange={(selected) => {
                    if (selected) {
                      massSelection.selectLead(lead.id);
                    } else {
                      massSelection.deselectLead(lead.id);
                    }
                  }}
                  showCheckbox={massSelection.selectedLeads.length > 0}
                />
              ))}
            
            {column.leads.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhum lead nesta etapa
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
