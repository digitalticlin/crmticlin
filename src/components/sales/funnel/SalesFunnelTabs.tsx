
import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KanbanBoard } from '../KanbanBoard';
import { WonLostBoard } from './WonLostBoard';
import { SalesFunnelHeader } from './SalesFunnelHeader';
import { SalesFunnelFilters } from './SalesFunnelFilters';
import { SalesFunnelMassActions } from './SalesFunnelMassActions';
import { KanbanColumn, KanbanLead } from '@/types/kanban';
import { KanbanStage } from '@/types/funnel';
import { MassSelectionReturn } from '../KanbanBoard';

interface SalesFunnelTabsProps {
  funnelData: any;
  activeTab: 'kanban' | 'won-lost';
  setActiveTab: (tab: 'kanban' | 'won-lost') => void;
  stages: KanbanStage[];
  leads: KanbanLead[];
  searchTerm: string;
  selectedTags: string[];
  selectedUser: string;
  onOpenLeadDetail: (lead: KanbanLead) => void;
  onOpenChat?: (lead: KanbanLead) => void;
  onReturnToFunnel: (lead: KanbanLead) => void;
  onMoveToWonLost: (lead: KanbanLead, status: 'won' | 'lost') => Promise<void>;
}

// Mock mass selection hook with complete interface
const useMassSelection = (): MassSelectionReturn => ({
  selectedLeads: [],
  isSelected: () => false,
  toggleSelection: () => {},
  selectAll: () => {},
  clearSelection: () => {},
  selectMultiple: () => {}
});

export const SalesFunnelTabs = ({
  funnelData,
  activeTab,
  setActiveTab,
  stages,
  leads,
  searchTerm,
  selectedTags,
  selectedUser,
  onOpenLeadDetail,
  onOpenChat,
  onReturnToFunnel,
  onMoveToWonLost
}: SalesFunnelTabsProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMassActionsOpen, setIsMassActionsOpen] = useState(false);

  const wonStageId = useMemo(() => {
    return stages.find(stage => stage.is_won)?.id;
  }, [stages]);

  const lostStageId = useMemo(() => {
    return stages.find(stage => stage.is_lost)?.id;
  }, [stages]);

  const kanbanColumns = useMemo(() => {
    if (!stages || !leads) return [];

    return stages.map(stage => {
      let stageLeads = leads.filter(lead => lead.columnId === stage.id);

      // Aplicar filtros de busca
      if (searchTerm) {
        stageLeads = stageLeads.filter(lead =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      return {
        id: stage.id,
        title: stage.title,
        leads: stageLeads,
        color: stage.color || '#CCCCCC',
        isFixed: stage.is_fixed,
        isHidden: false
      } as KanbanColumn;
    });
  }, [stages, leads, searchTerm, selectedTags, selectedUser]);

  const allLeads = useMemo(() => {
    return kanbanColumns.reduce((acc: KanbanLead[], column: KanbanColumn) => {
      return acc.concat(column.leads);
    }, []);
  }, [kanbanColumns]);

  const massSelection = useMassSelection();

  const handleMoveToWonLost = async (lead: KanbanLead, status: 'won' | 'lost'): Promise<void> => {
    try {
      await onMoveToWonLost(lead, status);
    } catch (error) {
      console.error('Erro ao mover lead:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <SalesFunnelHeader
        funnelName={funnelData?.name || 'Funil de Vendas'}
        onFiltersClick={() => setIsFilterOpen(true)}
        onMassActionsClick={() => setIsMassActionsOpen(true)}
        massSelection={massSelection}
        allLeads={allLeads}
      />

      <SalesFunnelFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      <SalesFunnelMassActions
        isOpen={isMassActionsOpen}
        onClose={() => setIsMassActionsOpen(false)}
        massSelection={massSelection}
        allLeads={allLeads}
      />
      
      <div className="flex-1 min-h-0">
        {activeTab === 'kanban' && (
          <KanbanBoard
            columns={kanbanColumns}
            onColumnsChange={() => {}}
            onOpenLeadDetail={onOpenLeadDetail}
            onOpenChat={onOpenChat}
            onMoveToWonLost={handleMoveToWonLost}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
            massSelection={massSelection}
          />
        )}

        {activeTab === 'won-lost' && (
          <WonLostBoard
            stages={stages}
            leads={leads}
            onOpenLeadDetail={onOpenLeadDetail}
            onOpenChat={onOpenChat}
            onReturnToFunnel={onReturnToFunnel}
            wonStageId={wonStageId}
            lostStageId={lostStageId}
            searchTerm={searchTerm}
            selectedTags={selectedTags}
            selectedUser={selectedUser}
          />
        )}
      </div>
    </div>
  );
};
