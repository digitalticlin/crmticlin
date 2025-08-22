
import React, { useState } from 'react';
import { BoardContentOptimized } from './kanban/BoardContentOptimized';
import { KanbanColumn, KanbanLead } from '@/types/kanban';
import { toast } from 'sonner';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  searchQuery?: string;
  onLeadUpdate?: (leadId: string, updates: Partial<KanbanLead>) => void;
  onLeadDelete?: (leadId: string) => void;
  onStageChange?: (leadId: string, newStageId: string, oldStageId: string) => void;
  onOpenLeadDetail?: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onReturnToFunnel?: (lead: KanbanLead) => void;
  onMoveToWonLost?: (lead: KanbanLead, status: 'won' | 'lost') => Promise<void>;
  onColumnsChange?: (newColumns: KanbanColumn[]) => void;
  isWonLostView?: boolean;
  wonStageId?: string;
  lostStageId?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  searchQuery = '',
  onLeadUpdate = () => {},
  onLeadDelete = () => {},
  onStageChange = () => {},
  onOpenLeadDetail = () => {},
  onOpenChat,
  onReturnToFunnel,
  onMoveToWonLost,
  onColumnsChange = () => {},
  isWonLostView = false,
  wonStageId,
  lostStageId
}) => {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Mock mass selection
  const massSelection = {
    selectedLeads: [],
    selectLead: (leadId: string) => {},
    deselectLead: (leadId: string) => {},
    clearSelection: () => {},
    isSelected: (leadId: string) => false,
    selectAll: (leadIds: string[]) => {},
    toggleSelectAll: (leadIds: string[]) => {}
  };

  const handleOpenLeadDetail = (lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
    if (onOpenLeadDetail) {
      onOpenLeadDetail(lead);
    }
  };

  const handleLeadUpdate = async (leadId: string, updates: Partial<KanbanLead>) => {
    try {
      if (onLeadUpdate) {
        onLeadUpdate(leadId, updates);
      }
      toast.success('Lead atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
    }
  };

  const handleLeadDelete = async (leadId: string) => {
    try {
      if (onLeadDelete) {
        onLeadDelete(leadId);
      }
      toast.success('Lead removido com sucesso');
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      toast.error('Erro ao deletar lead');
    }
  };

  const handleStageChange = async (leadId: string, newStageId: string, oldStageId: string) => {
    try {
      if (onStageChange) {
        onStageChange(leadId, newStageId, oldStageId);
      }
      toast.success('Lead movido para nova etapa');
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast.error('Erro ao mover lead');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <BoardContentOptimized
          columns={columns}
          onOpenLeadDetail={handleOpenLeadDetail}
          onLeadUpdate={handleLeadUpdate}
          onLeadDelete={handleLeadDelete}
          onStageChange={handleStageChange}
          searchQuery={searchQuery}
          massSelection={massSelection}
        />
      </div>
    </div>
  );
};
