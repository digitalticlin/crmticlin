import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, CreditCard, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * Error Boundary específico para o módulo de Billing
 * Captura erros relacionados a planos, pagamentos e uso
 */
export class BillingErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualizar state para mostrar a UI de fallback
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Registrar o erro
    console.error('[BillingErrorBoundary] Erro capturado:', error);
    console.error('[BillingErrorBoundary] Stack trace:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo
    });

    // Chamar callback customizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Enviar erro para serviço de monitoramento (se configurado)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Aqui você pode integrar com serviços como Sentry, LogRocket, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      module: 'billing',
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Por enquanto, apenas log no console
    console.warn('[BillingErrorBoundary] Relatório de erro:', errorReport);
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      // Se foi fornecido um fallback customizado, usar ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão com UI rica
      return <BillingErrorFallback
        error={this.state.error}
        retryCount={this.state.retryCount}
        maxRetries={this.maxRetries}
        onRetry={this.handleRetry}
        onReset={this.handleReset}
      />;
    }

    return this.props.children;
  }
}

/**
 * Componente de fallback para erros de billing
 */
interface BillingErrorFallbackProps {
  error: Error | null;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onReset: () => void;
}

const BillingErrorFallback: React.FC<BillingErrorFallbackProps> = ({
  error,
  retryCount,
  maxRetries,
  onRetry,
  onReset
}) => {
  const navigate = useNavigate();

  const getErrorType = () => {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('not acceptable') || message.includes('406')) {
      return 'database';
    }
    if (message.includes('tolocalestring') || message.includes('undefined')) {
      return 'data';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    return 'unknown';
  };

  const getErrorDetails = () => {
    const errorType = getErrorType();

    switch (errorType) {
      case 'database':
        return {
          title: 'Problema com Sistema de Planos',
          description: 'Não foi possível carregar informações dos planos. Nossa equipe já foi notificada.',
          suggestion: 'Tente novamente em alguns minutos ou entre em contato conosco.',
          icon: CreditCard,
          color: 'text-orange-500'
        };

      case 'data':
        return {
          title: 'Dados Indisponíveis',
          description: 'Algumas informações não puderam ser carregadas corretamente.',
          suggestion: 'Recarregue a página ou tente acessar outra seção.',
          icon: AlertTriangle,
          color: 'text-yellow-500'
        };

      case 'network':
        return {
          title: 'Problema de Conexão',
          description: 'Não foi possível conectar com nossos servidores.',
          suggestion: 'Verifique sua conexão com a internet e tente novamente.',
          icon: RefreshCw,
          color: 'text-blue-500'
        };

      default:
        return {
          title: 'Erro Inesperado',
          description: 'Algo deu errado ao carregar esta página.',
          suggestion: 'Tente recarregar a página ou volte ao dashboard.',
          icon: AlertTriangle,
          color: 'text-red-500'
        };
    }
  };

  const errorDetails = getErrorDetails();
  const Icon = errorDetails.icon;
  const canRetry = retryCount < maxRetries;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 p-3 rounded-full bg-gray-100 w-fit ${errorDetails.color}`}>
            <Icon className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl">{errorDetails.title}</CardTitle>
          <CardDescription className="text-sm">
            {errorDetails.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {errorDetails.suggestion}
            </AlertDescription>
          </Alert>

          {/* Detalhes técnicos em modo dev */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Detalhes técnicos (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2">
            {canRetry && (
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente ({maxRetries - retryCount} tentativas restantes)
              </Button>
            )}

            <Button variant="outline" onClick={onReset} className="w-full">
              Recarregar Página
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Hook para usar o error boundary de forma programática
 */
export const useBillingErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`[Billing] Erro em ${context || 'componente'}:`, error);

    // Aqui você pode adicionar lógica adicional como:
    // - Enviar para serviço de monitoramento
    // - Mostrar toast de erro
    // - Invalidar cache
    // - Etc.
  };

  return { handleError };
};

/**
 * HOC para envolver componentes com error boundary
 */
export const withBillingErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <BillingErrorBoundary>
      <Component {...props} />
    </BillingErrorBoundary>
  );

  WrappedComponent.displayName = `withBillingErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};