import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { PortalErrorBoundary } from '@/components/error/PortalErrorBoundary';

interface SafeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface SafeDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface SafeDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface SafeDialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface SafeDialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

// Safe Dialog wrapper that prevents Portal errors
export const SafeDialog = ({ open, onOpenChange, children }: SafeDialogProps) => {
  return (
    <PortalErrorBoundary>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </PortalErrorBoundary>
  );
};

export const SafeDialogContent = ({ className, children }: SafeDialogContentProps) => {
  return (
    <PortalErrorBoundary>
      <DialogContent className={className}>
        {children}
      </DialogContent>
    </PortalErrorBoundary>
  );
};

export const SafeDialogHeader = ({ className, children }: SafeDialogHeaderProps) => {
  return (
    <DialogHeader className={className}>
      {children}
    </DialogHeader>
  );
};

export const SafeDialogTitle = ({ className, children }: SafeDialogTitleProps) => {
  return (
    <DialogTitle className={className}>
      {children}
    </DialogTitle>
  );
};

export const SafeDialogDescription = ({ className, children }: SafeDialogDescriptionProps) => {
  return (
    <DialogDescription className={className}>
      {children}
    </DialogDescription>
  );
};