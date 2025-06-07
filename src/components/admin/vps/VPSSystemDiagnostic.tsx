
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Server, 
  Wifi, 
  Settings,
  Loader2
} from "lucide-react";

interface DiagnosticResult {
  success: boolean;
  diagnostic?: {
    timestamp: string;
    duration: string;
    overallHealth: boolean;
    summary: {
      connectivity: boolean;
      endpointsWorking: string;
      canCreateInstances: boolean;
    };
    details: {
      connectivity: any;
      endpoints: any[];
      instanceCreation: any;
    };
    recommendations: string[];
  };
  error?: string;
}

export const VPSSystemDiagnostic = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    try {
      setTesting(true);
      toast.info("🔍 Executando diagnóstico completo da VPS...");

      const { data, error } = await supabase.functions.invoke('vps_comprehensive_diagnostic', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      
      if (data.diagnostic?.overallHealth) {
        toast.success("✅ VPS está funcionando perfeitamente!");
      } else {
        toast.warning("⚠️ Problemas detectados na VPS - verificar recomendações");
      }

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      toast.error(`❌ Falha no diagnóstico: ${error.message}`);
      
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const getHealthBadge = (health: boolean) => {
    return health ? (
      <Badge className="bg-green-600">SAUDÁVEL</Badge>
    ) : (
      <Badge variant="destructive">PROBLEMAS</Badge>
    );
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle>Diagnóstico Completo do Sistema</CardTitle>
          </div>
          <Button 
            onClick={runDiagnostic} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Diagnosticando...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                Executar Diagnóstico
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!result && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Executar Diagnóstico" para verificar o sistema completo</p>
          </div>
        )}

        {result && result.success && result.diagnostic && (
          <div className="space-y-6">
            {/* Status Geral */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🖥️</div>
                <div>
                  <h3 className="font-medium">Sistema WhatsApp VPS</h3>
                  <p className="text-sm text-muted-foreground">
                    Diagnóstico executado em {result.diagnostic.duration}
                  </p>
                </div>
              </div>
              {getHealthBadge(result.diagnostic.overallHealth)}
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded">
                <Wifi className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Conectividade</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    {getStatusIcon(result.diagnostic.summary.connectivity)}
                    {result.diagnostic.summary.connectivity ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded">
                <Server className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">Endpoints</div>
                  <div className="text-sm text-muted-foreground">
                    {result.diagnostic.summary.endpointsWorking} funcionando
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded">
                <Settings className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="font-medium">Criação Instâncias</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    {getStatusIcon(result.diagnostic.summary.canCreateInstances)}
                    {result.diagnostic.summary.canCreateInstances ? 'Funcionando' : 'Com problemas'}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes dos Endpoints */}
            {result.diagnostic.details.endpoints && result.diagnostic.details.endpoints.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Status dos Endpoints:</h4>
                <div className="space-y-2">
                  {result.diagnostic.details.endpoints.map((endpoint: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{endpoint.method} {endpoint.endpoint}</span>
                        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(endpoint.working)}
                        <span className="text-sm">Status: {endpoint.status || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendações */}
            {result.diagnostic.recommendations.length > 0 && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Recomendações:</h4>
                </div>
                <ul className="space-y-2">
                  {result.diagnostic.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Diagnóstico executado em: {new Date(result.diagnostic.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        )}

        {result && !result.success && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-800">Erro no Diagnóstico:</h4>
            </div>
            <p className="text-sm text-red-700">{result.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
