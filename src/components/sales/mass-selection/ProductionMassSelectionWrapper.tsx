
import React from 'react';
import { MassSelectionProvider } from '@/contexts/MassSelectionContext';
import { useMassSelection } from '@/hooks/sales/useMassSelection';
import { MassSelectionToolbar } from './MassSelectionToolbar';
import { MassSelectionIndicator } from './MassSelectionIndicator';

interface ProductionMassSelectionWrapperProps {
  children: React.ReactElement;
  onBulkUpdate: (leadIds: string[], updates: any) => Promise<void>;
  onBulkDelete: (leadIds: string[]) => Promise<void>;
  onBulkStageChange: (leadIds: string[], stageId: string) => Promise<void>;
}

const MassSelectionContent: React.FC<{
  children: React.ReactElement;
  onBulkUpdate: (leadIds: string[], updates: any) => Promise<void>;
  onBulkDelete: (leadIds: string[]) => Promise<void>;
  onBulkStageChange: (leadIds: string[], stageId: string) => Promise<void>;
}> = ({ children, onBulkUpdate, onBulkDelete, onBulkStageChange }) => {
  const massSelection = useMassSelection();

  return (
    <div className="relative h-full">
      {/* Main content */}
      <div className="h-full">
        {React.cloneElement(children, { massSelection })}
      </div>

      {/* Mass selection controls */}
      {massSelection.selectedLeads.length > 0 && (
        <>
          <MassSelectionIndicator count={massSelection.selectedLeads.length} />
          <MassSelectionToolbar
            selectedLeads={massSelection.selectedLeads}
            onBulkUpdate={onBulkUpdate}
            onBulkDelete={onBulkDelete}
            onBulkStageChange={onBulkStageChange}
            onClearSelection={massSelection.clearSelection}
          />
        </>
      )}
    </div>
  );
};

export const ProductionMassSelectionWrapper: React.FC<ProductionMassSelectionWrapperProps> = ({
  children,
  onBulkUpdate,
  onBulkDelete,
  onBulkStageChange
}) => {
  return (
    <MassSelectionProvider>
      <MassSelectionContent
        onBulkUpdate={onBulkUpdate}
        onBulkDelete={onBulkDelete}
        onBulkStageChange={onBulkStageChange}
      >
        {children}
      </MassSelectionContent>
    </MassSelectionProvider>
  );
};
