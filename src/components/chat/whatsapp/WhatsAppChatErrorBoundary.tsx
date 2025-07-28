
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface WhatsAppChatErrorBoundaryProps {
  children: React.ReactNode;
}

interface WhatsAppChatErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WhatsAppChatErrorBoundary extends React.Component<
  WhatsAppChatErrorBoundaryProps,
  WhatsAppChatErrorBoundaryState
> {
  constructor(props: WhatsAppChatErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WhatsAppChatErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WhatsApp Chat Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ocorreu um erro no chat do WhatsApp. Por favor, recarregue a página.
              {this.state.error && (
                <details className="mt-2 text-xs">
                  <summary>Detalhes do erro</summary>
                  <pre className="mt-1 whitespace-pre-wrap">{this.state.error.message}</pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
