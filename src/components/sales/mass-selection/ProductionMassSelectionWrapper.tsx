
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MassSelectionReturn } from '@/hooks/useMassSelection';

interface ProductionMassSelectionWrapperProps {
  massSelection: MassSelectionReturn;
  children: React.ReactElement;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <h2 className="text-lg font-semibold text-red-800">Erro na Seleção em Massa</h2>
      <p className="text-red-600 mt-2">
        Algo deu errado: {error.message}
      </p>
    </div>
  );
}

export const ProductionMassSelectionWrapper = ({ 
  massSelection, 
  children 
}: ProductionMassSelectionWrapperProps) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="relative">
        {/* Mass Selection UI */}
        {massSelection.isSelectionMode && (
          <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">
                {massSelection.selectedCount} selecionados
              </span>
              <button
                onClick={massSelection.clearSelection}
                className="text-red-600 hover:text-red-800 text-xs underline"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
        
        {/* Single child wrapped in div to satisfy JSX requirements */}
        <div>
          {children}
        </div>
      </div>
    </ErrorBoundary>
  );
};
