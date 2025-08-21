import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface MassSelectionWrapperProps {
  children: React.ReactNode;
}

const ErrorFallback = ({ error }: { error: Error }) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: 'red' }}>{error.message}</pre>
    </div>
  );
};

export const ProductionMassSelectionWrapper: React.FC<MassSelectionWrapperProps> = ({ children }) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="mass-selection-wrapper">
        {children}
      </div>
    </ErrorBoundary>
  );
};
