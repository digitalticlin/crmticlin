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
      
      // Auto-recover from Portal errors after a short delay
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 100);
      
      return;
    }

    // Log other errors normally
    console.error('[PortalErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Return fallback UI or nothing for Portal errors
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // For Portal errors, just return null to avoid render issues
      return null;
    }

    return this.props.children;
  }
}