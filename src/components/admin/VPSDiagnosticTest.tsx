
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Terminal, CheckCircle, AlertCircle, Copy } from "lucide-react";

interface DiagnosticResults {
  success: boolean;
  message: string;
  timestamp: string;
  vps: {
    host: string;
    port: number;
    type: string;
  };
  diagnostics: {
    connectivity: {
      basic_ping: { success: boolean; details: string };
      node_server: { success: boolean; details: string };
      server_info: { success: boolean; data?: any };
      instances_list: { success: boolean; data?: any };
      webhook_url: { success: boolean; details: string };
    };
    analysis: {
      server_running: boolean;
      has_instances: boolean;
      webhook_reachable: boolean;
      total_instances: number;
    };
  };
  recommendations: Array<{
    priority: string;
    issue: string;
    solution: string;
  }>;
  verification_script: string;
  summary: {
    server_status: string;
    total_issues: number;
    total_warnings: number;
    next_steps: string[];
  };
}

export const VPSDiagnosticTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<DiagnosticResults | null>(null);

  const runDiagnostic = async () => {
    try {
      setTesting(true);
      toast.info("Iniciando diagnóstico completo da VPS...");

      const { data, error } = await supabase.functions.invoke('test_vps_connection', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setResults(data);
      
      if (data.success) {
        toast.success("Diagnóstico completo executado!");
      } else {
        toast.error(`Diagnóstico falhou: ${data.error}`);
      }

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência!`);
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "SUCESSO" : "FALHOU"}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRÍTICO': return 'text-red-600';
      case 'ALTO': return 'text-orange-600';
      case 'INFORMATIVO': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-blue-600" />
              <CardTitle>Diagnóstico VPS WhatsApp Web.js</CardTitle>
            </div>
            <Button 
              onClick={runDiagnostic} 
              disabled={testing}
              className="flex items-center gap-2"
            >
              {testing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Executando...
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
          <p className="text-sm text-muted-foreground">
            Executa um teste completo da VPS para verificar conectividade, servidor Node.js, 
            instâncias WhatsApp e configuração de webhooks.
          </p>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.summary.server_status === "ONLINE" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                Resumo do Diagnóstico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.summary.server_status}
                  </div>
                  <div className="text-sm text-muted-foreground">Status do Servidor</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {results.summary.total_issues}
                  </div>
                  <div className="text-sm text-muted-foreground">Problemas Críticos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {results.summary.total_warnings}
                  </div>
                  <div className="text-sm text-muted-foreground">Avisos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.diagnostics.analysis.total_instances}
                  </div>
                  <div className="text-sm text-muted-foreground">Instâncias</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testes de Conectividade */}
          <Card>
            <CardHeader>
              <CardTitle>Testes de Conectividade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Ping Básico ({results.vps.host})</span>
                  {getStatusBadge(results.diagnostics.connectivity.basic_ping.success)}
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Servidor Node.js (porta {results.vps.port})</span>
                  {getStatusBadge(results.diagnostics.connectivity.node_server.success)}
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Informações do Servidor</span>
                  {getStatusBadge(results.diagnostics.connectivity.server_info.success)}
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Lista de Instâncias</span>
                  {getStatusBadge(results.diagnostics.connectivity.instances_list.success)}
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>URL do Webhook</span>
                  {getStatusBadge(results.diagnostics.connectivity.webhook_url.success)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          {results.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.recommendations.map((rec, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <h4 className="font-medium mb-2">{rec.issue}</h4>
                    <p className="text-sm text-muted-foreground">{rec.solution}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Script de Verificação */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Script de Verificação na VPS</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(results.verification_script, 'Script de verificação')}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Script
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{results.verification_script}</pre>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p><strong>Para usar:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copie o script acima</li>
                  <li>Conecte na VPS: <code>ssh root@{results.vps.host}</code></li>
                  <li>Cole e execute o script para verificar todos os componentes</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes Técnicos */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h4 className="font-medium mb-2">Servidor Node.js:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {results.diagnostics.connectivity.node_server.details}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Webhook:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    {results.diagnostics.connectivity.webhook_url.details}
                  </div>
                </div>
                {results.diagnostics.connectivity.server_info.data && (
                  <div>
                    <h4 className="font-medium mb-2">Informações do Servidor:</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(results.diagnostics.connectivity.server_info.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {results.diagnostics.connectivity.instances_list.data && (
                  <div>
                    <h4 className="font-medium mb-2">Instâncias Encontradas:</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(results.diagnostics.connectivity.instances_list.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            Diagnóstico executado em: {new Date(results.timestamp).toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  );
};
