
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity, CheckCircle, AlertTriangle, XCircle, Terminal } from "lucide-react";

interface QuickDiagnosticResults {
  timestamp: string;
  vps_status: 'online' | 'offline' | 'partial';
  whatsapp_server: boolean;
  api_server: boolean;
  webhook_connectivity: boolean;
  issues_found: string[];
  recommendations: string[];
}

export const VPSQuickDiagnostic = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<QuickDiagnosticResults | null>(null);

  const runQuickDiagnostic = async () => {
    try {
      setTesting(true);
      toast.info("🔍 Executando diagnóstico rápido da VPS...");

      const { data, error } = await supabase.functions.invoke('test_vps_connection', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      // Processar resultados para formato simplificado
      const quickResults: QuickDiagnosticResults = {
        timestamp: data.timestamp,
        vps_status: data.success ? (data.diagnostics?.analysis?.server_running ? 'online' : 'partial') : 'offline',
        whatsapp_server: data.diagnostics?.connectivity?.node_server?.success || false,
        api_server: false, // Verificar se porta 3002 está respondendo
        webhook_connectivity: data.diagnostics?.connectivity?.webhook_url?.success || false,
        issues_found: [],
        recommendations: data.recommendations?.map((r: any) => r.solution) || []
      };

      // Identificar problemas específicos
      if (!quickResults.whatsapp_server) {
        quickResults.issues_found.push("Servidor WhatsApp (porta 3001) não está respondendo");
      }
      if (!quickResults.webhook_connectivity) {
        quickResults.issues_found.push("Webhook Supabase não está acessível");
      }
      if (data.diagnostics?.analysis?.total_instances === 0) {
        quickResults.issues_found.push("Nenhuma instância WhatsApp ativa");
      }

      setResults(quickResults);
      
      if (quickResults.vps_status === 'online') {
        toast.success("✅ Diagnóstico concluído - VPS funcionando!");
      } else {
        toast.warning("⚠️ Problemas detectados na VPS");
      }

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      toast.error(`❌ Falha no diagnóstico: ${error.message}`);
      
      setResults({
        timestamp: new Date().toISOString(),
        vps_status: 'offline',
        whatsapp_server: false,
        api_server: false,
        webhook_connectivity: false,
        issues_found: [`Erro de conexão: ${error.message}`],
        recommendations: ['Verificar conectividade de rede', 'Reiniciar serviços VPS']
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getVPSStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600">ONLINE</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-600">PARCIAL</Badge>;
      case 'offline':
        return <Badge variant="destructive">OFFLINE</Badge>;
      default:
        return <Badge variant="outline">DESCONHECIDO</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle>Diagnóstico Rápido VPS</CardTitle>
          </div>
          <Button 
            onClick={runQuickDiagnostic} 
            disabled={testing}
            className="flex items-center gap-2"
          >
            {testing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Diagnosticando...
              </>
            ) : (
              <>
                <Terminal className="h-4 w-4" />
                Executar Diagnóstico
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!results && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Executar Diagnóstico" para verificar o status da VPS</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Status Geral */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🖥️</div>
                <div>
                  <h3 className="font-medium">Status Geral da VPS</h3>
                  <p className="text-sm text-muted-foreground">31.97.24.222</p>
                </div>
              </div>
              {getVPSStatusBadge(results.vps_status)}
            </div>

            {/* Serviços */}
            <div className="grid gap-4">
              <h4 className="font-medium">Status dos Serviços:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded">
                  {getStatusIcon(results.whatsapp_server)}
                  <div>
                    <div className="font-medium">WhatsApp Server</div>
                    <div className="text-sm text-muted-foreground">Porta 3001</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded">
                  {getStatusIcon(results.api_server)}
                  <div>
                    <div className="font-medium">API Server</div>
                    <div className="text-sm text-muted-foreground">Porta 3002</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded">
                  {getStatusIcon(results.webhook_connectivity)}
                  <div>
                    <div className="font-medium">Webhook</div>
                    <div className="text-sm text-muted-foreground">Supabase</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Problemas Encontrados */}
            {results.issues_found.length > 0 && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium text-red-800">Problemas Detectados:</h4>
                </div>
                <ul className="space-y-2">
                  {results.issues_found.map((issue, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendações */}
            {results.recommendations.length > 0 && (
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-800 mb-3">Recomendações:</h4>
                <ul className="space-y-2">
                  {results.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Último diagnóstico: {new Date(results.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
