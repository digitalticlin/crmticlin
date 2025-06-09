
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity, CheckCircle, AlertTriangle, Loader2, Zap } from "lucide-react";

export const VPSDiagnosticButton = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const runDiagnostic = async () => {
    try {
      setIsRunning(true);
      toast.loading('Executando diagnóstico da VPS...', { id: 'vps-diagnostic' });

      const { data, error } = await supabase.functions.invoke('vps_quick_diagnostic', {
        body: {}
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      setDiagnosticResult(data);
      
      if (data.success) {
        const summary = data.diagnostic_results.summary;
        if (summary.vps_online && summary.whatsapp_server_online) {
          toast.success('VPS e WhatsApp Server estão online!', { id: 'vps-diagnostic' });
        } else {
          toast.warning('Problemas detectados na infraestrutura', { id: 'vps-diagnostic' });
        }
      } else {
        toast.error('Falha no diagnóstico', { id: 'vps-diagnostic' });
      }

    } catch (error: any) {
      console.error('[VPS Diagnostic] ❌ Erro:', error);
      toast.error(`Erro no diagnóstico: ${error.message}`, { id: 'vps-diagnostic' });
      setDiagnosticResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={runDiagnostic}
        disabled={isRunning}
        className="w-full"
        variant="outline"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Executando Diagnóstico...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Diagnóstico Rápido da VPS
          </>
        )}
      </Button>

      {diagnosticResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Resultado do Diagnóstico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnosticResult.success ? (
              <>
                {/* Resumo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">VPS Online:</span>
                    {diagnosticResult.diagnostic_results.summary.vps_online ? (
                      <Badge className="bg-green-100 text-green-800">Sim</Badge>
                    ) : (
                      <Badge variant="destructive">Não</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">WhatsApp Server:</span>
                    {diagnosticResult.diagnostic_results.summary.whatsapp_server_online ? (
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    ) : (
                      <Badge variant="destructive">Offline</Badge>
                    )}
                  </div>
                </div>

                {/* Testes Detalhados */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Testes Executados:</h4>
                  {Object.entries(diagnosticResult.diagnostic_results.tests).map(([testName, testResult]: [string, any]) => (
                    <div key={testName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(testResult.status)}
                        <span className="text-sm">{testName.replace(/_/g, ' ')}</span>
                      </div>
                      {getStatusBadge(testResult.status)}
                    </div>
                  ))}
                </div>

                {/* Problemas Encontrados */}
                {diagnosticResult.diagnostic_results.summary.connectivity_issues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-red-700">Problemas Encontrados:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {diagnosticResult.diagnostic_results.summary.connectivity_issues.map((issue: string, index: number) => (
                        <li key={index} className="text-sm text-red-600">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recomendações */}
                {diagnosticResult.diagnostic_results.summary.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-blue-700">Recomendações:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {diagnosticResult.diagnostic_results.summary.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-blue-600">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Tempo total: {diagnosticResult.total_time_ms}ms
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-700">Falha no diagnóstico</p>
                <p className="text-sm text-gray-600">{diagnosticResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
