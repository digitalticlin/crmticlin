import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PortalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // For DOM Portal errors, don't set error state to avoid render breaks
    if (
      error.message?.includes('removeChild') ||
      error.message?.includes('Portal') ||
      error.message?.includes('insertBefore') ||
      error.message?.includes('The node to be removed is not a child') ||
      error.message?.includes('The node before which the new node is to be inserted is not a child')
    ) {
      console.warn('[PortalErrorBoundary] Portal DOM error ignored in getDerivedStateFromError:', error.message);
      return { hasError: false };
    }
    
    // Update state so the next render will show the fallback UI for other errors
    console.error('[PortalErrorBoundary] Portal error captured:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if it's a Portal/DOM manipulation error
    if (
      error.message?.includes('removeChild') ||
      error.message?.includes('Portal') ||
      error.message?.includes('insertBefore') ||
      error.message?.includes('The node to be removed is not a child') ||
      error.message?.includes('The node before which the new node is to be inserted is not a child')
    ) {
      console.warn('[PortalErrorBoundary] Portal DOM error handled:', error.message);
      
      // Reset error state immediately for DOM Portal errors
      this.setState({ hasError: false, error: undefined });
      
      console.warn('[PortalErrorBoundary] Portal error handled gracefully, continuing...');
      
      return;
    }

    // Log other errors normally
    console.error('[PortalErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Para erros de Portal, NÃO quebrar o render - continuar normalmente
      if (
        this.state.error?.message?.includes('removeChild') ||
        this.state.error?.message?.includes('Portal') ||
        this.state.error?.message?.includes('The node to be removed is not a child')
      ) {
        console.warn('[PortalErrorBoundary] Portal error ignored, rendering children normally');
        // Resetar erro e continuar
        this.state.hasError = false;
        this.state.error = undefined;
        return this.props.children;
      }
      
      // Para outros erros, mostrar fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return null;
    }

    return this.props.children;
  }
}