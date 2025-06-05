
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, QrCode } from "lucide-react";

interface InstanceTestResult {
  step: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
  timestamp: string;
}

interface TestResultsDisplayProps {
  testResults: InstanceTestResult[];
}

export const TestResultsDisplay = ({ testResults }: TestResultsDisplayProps) => {
  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? 'SUCESSO' : 'FALHA'}
      </Badge>
    );
  };

  const getStepTitle = (step: string) => {
    const titles = {
      vps_connectivity: 'Conectividade VPS',
      vps_authentication: 'Autenticação VPS',
      instance_creation: 'Criação de Instância',
      immediate_qr_code: 'QR Code Imediato',
      qr_code_polling: 'Polling QR Code ROBUSTO'
    };
    return titles[step as keyof typeof titles] || step;
  };

  if (testResults.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-green-600" />
          Resultados do Teste (CORREÇÃO ROBUSTA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResults.map((result, index) => (
          <div key={result.step} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.success)}
                <span className="font-medium">
                  {index + 1}. {getStepTitle(result.step)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(result.success)}
                <span className="text-xs text-muted-foreground">
                  {result.duration}ms
                </span>
              </div>
            </div>
            
            {result.details && (
              <details className="text-xs mt-2">
                <summary className="cursor-pointer text-muted-foreground">
                  Ver detalhes técnicos
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}

            {result.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <strong>Erro:</strong> {result.error}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
