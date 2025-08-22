
import React from 'react';

interface MassSelectionToolbarProps {
  selectedCount: number;
  onBulkUpdate: (leadIds: string[], updates: any) => Promise<void>;
  onBulkDelete: (leadIds: string[]) => Promise<void>;
  onBulkStageChange: (leadIds: string[], stageId: string) => Promise<void>;
  onClearSelection: () => void;
}

const MassSelectionToolbar: React.FC<MassSelectionToolbarProps> = ({
  selectedCount,
  onClearSelection
}) => (
  <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
    <div className="flex items-center justify-between">
      <p className="text-blue-700">
        {selectedCount} leads selecionados
      </p>
      <button 
        onClick={onClearSelection}
        className="text-blue-600 hover:text-blue-800"
      >
        Limpar seleção
      </button>
    </div>
  </div>
);

interface ProductionMassSelectionWrapperProps {
  children: React.ReactNode;
  selectedLeads: string[];
  onBulkUpdate: (leadIds: string[], updates: any) => Promise<void>;
  onBulkDelete: (leadIds: string[]) => Promise<void>;
  onBulkStageChange: (leadIds: string[], stageId: string) => Promise<void>;
  onClearSelection: () => void;
}

export const ProductionMassSelectionWrapper: React.FC<ProductionMassSelectionWrapperProps> = ({
  children,
  selectedLeads,
  onBulkUpdate,
  onBulkDelete,
  onBulkStageChange,
  onClearSelection
}) => {
  return (
    <div className="relative">
      {selectedLeads.length > 0 && (
        <MassSelectionToolbar
          selectedCount={selectedLeads.length}
          onBulkUpdate={onBulkUpdate}
          onBulkDelete={onBulkDelete}
          onBulkStageChange={onBulkStageChange}
          onClearSelection={onClearSelection}
        />
      )}
      {children}
    </div>
  );
};
