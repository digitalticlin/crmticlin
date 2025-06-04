
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { DiagnosticResult } from "./DiagnosticTypes";

interface DiagnosticResultsDisplayProps {
  results: DiagnosticResult[];
}

export const DiagnosticResultsDisplay = ({ results }: DiagnosticResultsDisplayProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-medium">Resultados do Diagnóstico:</h3>
      {results.map((result, index) => (
        <div key={index} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(result.status)}
              <span className="font-medium">{result.test}</span>
            </div>
            <Badge className={getStatusColor(result.status)}>
              {result.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {result.message}
          </p>
          {result.details && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                Ver detalhes
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
};
