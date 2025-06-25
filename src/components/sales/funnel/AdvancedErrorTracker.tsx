import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Bug, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
  onErrorCaptured?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorStack?: string;
}

export class AdvancedErrorTracker extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorStack: error.stack 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      timestamp,
      component: this.props.componentName,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.group(`🚨 [AdvancedErrorTracker] Erro capturado em ${this.props.componentName}`);
    console.error('📍 Timestamp:', timestamp);
    console.error('🎯 Componente:', this.props.componentName);
    console.error('❌ Erro:', error);
    console.error('📊 Stack trace:', error.stack);
    console.error('🔍 Component stack:', errorInfo.componentStack);
    console.error('📋 Detalhes completos:', errorDetails);
    console.groupEnd();

    // Callback para captura externa
    if (this.props.onErrorCaptured) {
      this.props.onErrorCaptured(error, errorInfo);
    }

    // Salvar no localStorage para debug persistente
    try {
      const savedErrors = JSON.parse(localStorage.getItem('dragDropErrors') || '[]');
      savedErrors.push(errorDetails);
      // Manter apenas os últimos 10 erros
      if (savedErrors.length > 10) {
        savedErrors.splice(0, savedErrors.length - 10);
      }
      localStorage.setItem('dragDropErrors', JSON.stringify(savedErrors));
    } catch (e) {
      console.warn('Não foi possível salvar erro no localStorage:', e);
    }

    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    console.log(`🔄 [AdvancedErrorTracker] Tentando novamente em ${this.props.componentName}`);
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorStack: undefined });
  };

  private handleShowDebugInfo = () => {
    const errors = JSON.parse(localStorage.getItem('dragDropErrors') || '[]');
    console.group('🔍 [AdvancedErrorTracker] Histórico de erros salvos');
    console.table(errors);
    console.groupEnd();
    
    if (errors.length > 0) {
      alert(`Encontrados ${errors.length} erros salvos. Verifique o console para detalhes.`);
    } else {
      alert('Nenhum erro salvo encontrado.');
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isProductionError = !this.state.error?.stack?.includes('localhost');

      return (
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-dashed border-red-300 p-6">
          <div className="text-center space-y-4 max-w-2xl">
            <div className="text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            </div>
            
            <h3 className="text-lg font-medium text-red-900">
              Erro no Componente: {this.props.componentName}
            </h3>
            
            <p className="text-red-700 text-sm">
              {this.state.error?.message || 'Erro desconhecido durante o carregamento'}
            </p>

            {/* Debug info para desenvolvimento */}
            {!isProductionError && this.state.errorStack && (
              <details className="text-left bg-red-100 p-3 rounded text-xs max-h-32 overflow-auto">
                <summary className="cursor-pointer font-medium">Stack Trace (Desenvolvimento)</summary>
                <pre className="mt-2 whitespace-pre-wrap text-red-800">
                  {this.state.errorStack}
                </pre>
              </details>
            )}

            {/* Componente específico info */}
            {this.state.errorInfo?.componentStack && (
              <details className="text-left bg-yellow-100 p-3 rounded text-xs max-h-32 overflow-auto">
                <summary className="cursor-pointer font-medium">Component Stack</summary>
                <pre className="mt-2 whitespace-pre-wrap text-yellow-800">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={this.handleRetry} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button onClick={() => window.location.reload()} variant="default" size="sm">
                Recarregar Página
              </Button>
              
              {!isProductionError && (
                <Button onClick={this.handleShowDebugInfo} variant="ghost" size="sm">
                  <Bug className="w-4 h-4 mr-2" />
                  Debug Info
                </Button>
              )}
            </div>

            <p className="text-xs text-red-600 mt-4">
              Erro ID: {this.state.error?.name}-{Date.now().toString(36)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 