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
    // Update state so the next render will show the fallback UI
    console.error('[PortalErrorBoundary] Portal error captured:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if it's a Portal/DOM manipulation error
    if (
      error.message?.includes('removeChild') ||
      error.message?.includes('Portal') ||
      error.message?.includes('The node to be removed is not a child')
    ) {
      console.warn('[PortalErrorBoundary] Portal DOM error handled:', error.message);
      
      // CRÍTICO: NÃO fazer auto-recover que corrompe estados
      // setTimeout(() => {
      //   this.setState({ hasError: false, error: undefined });
      // }, 100);
      
      // Apenas log o erro, mas não quebrar o estado do componente
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