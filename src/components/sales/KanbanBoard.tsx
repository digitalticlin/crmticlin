
import React, { useState, useEffect } from 'react';
import { BoardContentOptimized } from './kanban/BoardContentOptimized';
import { LeadDetailModal } from './LeadDetailModal';
import { KanbanColumn, KanbanLead } from '@/types/kanban';
import { useMassSelection } from '@/hooks/sales/useMassSelection';
import { useLeadActions } from '@/hooks/sales/useLeadActions';
import { toast } from 'sonner';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  searchQuery: string;
  onColumnUpdate?: (updatedColumn: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
  onLeadUpdate: (leadId: string, updates: Partial<KanbanLead>) => void;
  onLeadDelete: (leadId: string) => void;
  onStageChange: (leadId: string, newStageId: string, oldStageId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  searchQuery,
  onLeadUpdate,
  onLeadDelete,
  onStageChange
}) => {
  const [selectedLead, setSelectedLead] = useState<KanbanLead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const massSelection = useMassSelection();
  const { updateLead, deleteLead } = useLeadActions();

  const handleOpenLeadDetail = (lead: KanbanLead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleCloseLeadDetail = () => {
    setSelectedLead(null);
    setIsDetailModalOpen(false);
  };

  const handleLeadUpdate = async (leadId: string, updates: Partial<KanbanLead>) => {
    try {
      await updateLead(leadId, updates);
      onLeadUpdate(leadId, updates);
      toast.success('Lead atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
    }
  };

  const handleLeadDelete = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      onLeadDelete(leadId);
      toast.success('Lead removido com sucesso');
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      toast.error('Erro ao deletar lead');
    }
  };

  const handleStageChange = async (leadId: string, newStageId: string, oldStageId: string) => {
    try {
      await updateLead(leadId, { stage_id: newStageId });
      onStageChange(leadId, newStageId, oldStageId);
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

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          isOpen={isDetailModalOpen}
          onClose={handleCloseLeadDetail}
          onUpdate={(updates) => handleLeadUpdate(selectedLead.id, updates)}
          onDelete={() => {
            handleLeadDelete(selectedLead.id);
            handleCloseLeadDetail();
          }}
        />
      )}
    </div>
  );
};
