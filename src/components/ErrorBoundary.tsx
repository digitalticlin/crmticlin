import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar a UI de erro
    console.error('[ErrorBoundary] Erro capturado:', error);
    
    // Para erros de realtime, tentar recuperar automaticamente
    if (error.message.includes('callbacks') || error.message.includes('realtime')) {
      console.warn('[ErrorBoundary] Erro de realtime detectado, tentando recuperar...');
      // Não mostrar erro para problemas de realtime, apenas logar
      return { hasError: false, retryCount: 0 };
    }
    
    return { hasError: true, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Detalhes do erro:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      error,
      errorInfo
    });

    // Para erros de realtime, tentar limpar e reinicializar
    if (error.message.includes('callbacks') || error.message.includes('realtime')) {
      console.log('[ErrorBoundary] Tentando limpar estado do realtime...');
      
      // Limpar localStorage de realtime se existir
      try {
        localStorage.removeItem('realtime-manager-state');
      } catch (e) {
        console.warn('[ErrorBoundary] Erro ao limpar localStorage:', e);
      }
      
      // Auto-retry após delay
      setTimeout(() => {
        this.handleRetry();
      }, 1000);
    }
  }

  handleRetry = () => {
    console.log('[ErrorBoundary] Tentando recuperar aplicação...');
    
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
    
    // Recarregar página se muitos erros
    if (this.state.retryCount >= 3) {
      console.warn('[ErrorBoundary] Muitos erros, recarregando página...');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback customizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isRealtimeError = this.state.error?.message.includes('callbacks') || 
                             this.state.error?.message.includes('realtime');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            <Alert variant={isRealtimeError ? "default" : "destructive"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {isRealtimeError ? 'Problema de Conexão' : 'Algo deu errado'}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {isRealtimeError ? (
                  <span>
                    Detectamos um problema com a sincronização em tempo real. 
                    A aplicação continuará funcionando, mas alguns recursos podem estar limitados.
                  </span>
                ) : (
                  <span>
                    Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
                  </span>
                )}
              </AlertDescription>
              
              <div className="mt-4 space-y-2">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                {this.state.retryCount >= 2 && (
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="default"
                    className="w-full"
                  >
                    Recarregar Página
                  </Button>
                )}
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-gray-600">
                    Detalhes técnicos (desenvolvimento)
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
              </details>
            )}
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
