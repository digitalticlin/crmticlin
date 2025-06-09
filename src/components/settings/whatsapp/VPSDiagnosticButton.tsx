
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Zap, 
  Network,
  Timer,
  Heart,
  TestTube,
  Wifi
} from "lucide-react";

export const VPSDiagnosticButton = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const runDiagnostic = async (testType: string = 'full') => {
    try {
      setIsRunning(true);
      toast.loading(`Executando ${testType}...`, { id: 'vps-diagnostic' });

      const { data, error } = await supabase.functions.invoke('vps_connectivity_diagnostic', {
        body: { testType }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      setDiagnosticResult(data);
      
      if (data.success) {
        const summary = data.result.summary;
        if (summary?.pingWorking) {
          toast.success('Conectividade VPS confirmada!', { id: 'vps-diagnostic' });
        } else {
          toast.warning('Problemas de conectividade detectados', { id: 'vps-diagnostic' });
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

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (success: boolean) => {
    return success ? 
      <Badge className="bg-green-100 text-green-800">Sucesso</Badge> : 
      <Badge variant="destructive">Erro</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Botões de Teste */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Button 
          onClick={() => runDiagnostic('simple_ping')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Wifi className="h-4 w-4 mr-1" />
          Ping
        </Button>
        
        <Button 
          onClick={() => runDiagnostic('progressive_timeout')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Timer className="h-4 w-4 mr-1" />
          Timeout
        </Button>
        
        <Button 
          onClick={() => runDiagnostic('health_check')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Heart className="h-4 w-4 mr-1" />
          Health
        </Button>
        
        <Button 
          onClick={() => runDiagnostic('create_instance_simulation')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <TestTube className="h-4 w-4 mr-1" />
          Criar Inst.
        </Button>
        
        <Button 
          onClick={() => runDiagnostic('network_analysis')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Network className="h-4 w-4 mr-1" />
          Rede
        </Button>
        
        <Button 
          onClick={() => runDiagnostic('full')}
          disabled={isRunning}
          className="col-span-2 md:col-span-1"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
              Executando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-1" />
              Completo
            </>
          )}
        </Button>
      </div>

      {/* Resultados */}
      {diagnosticResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Diagnóstico VPS - {diagnosticResult.testType}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnosticResult.success ? (
              <>
                {/* Resumo (se for diagnóstico completo) */}
                {diagnosticResult.result.summary && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                    <div className="text-sm">
                      <span className="font-medium">Ping:</span>
                      {getStatusBadge(diagnosticResult.result.summary.pingWorking)}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Melhor Timeout:</span>
                      <Badge variant="secondary">
                        {diagnosticResult.result.summary.bestTimeout}ms
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Endpoints OK:</span>
                      <Badge variant="secondary">
                        {diagnosticResult.result.summary.healthEndpoints}/3
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Criar Instância:</span>
                      {getStatusBadge(diagnosticResult.result.summary.createInstanceWorking)}
                    </div>
                  </div>
                )}

                {/* Resultados detalhados */}
                <div className="space-y-3">
                  {/* Ping simples */}
                  {diagnosticResult.result.success !== undefined && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(diagnosticResult.result.success)}
                        <span className="text-sm">Ping Simples</span>
                        {diagnosticResult.result.responseTime && (
                          <Badge variant="outline">{diagnosticResult.result.responseTime}ms</Badge>
                        )}
                      </div>
                      {getStatusBadge(diagnosticResult.result.success)}
                    </div>
                  )}

                  {/* Resultados de timeout progressivo */}
                  {diagnosticResult.result.results && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Testes de Timeout:</h4>
                      {diagnosticResult.result.results.map((result: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.success)}
                            <span className="text-sm">{result.timeout}ms</span>
                            {result.responseTime && (
                              <Badge variant="outline">{result.responseTime}ms</Badge>
                            )}
                          </div>
                          {getStatusBadge(result.success)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Health check detalhado */}
                  {diagnosticResult.result.health?.results && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Health Check:</h4>
                      {diagnosticResult.result.health.results.map((result: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(result.success)}
                            <span className="text-sm">{result.endpoint}</span>
                            {result.responseTime && (
                              <Badge variant="outline">{result.responseTime}ms</Badge>
                            )}
                          </div>
                          {getStatusBadge(result.success)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  ID: {diagnosticResult.diagnosticId} | {diagnosticResult.timestamp}
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
