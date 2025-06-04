
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Target,
  Globe,
  Clock
} from "lucide-react";

interface EndpointResult {
  endpoint: string;
  method: string;
  status: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
  isJson?: boolean;
  responseSample?: string;
  error?: string;
}

interface DiscoveryResult {
  success: boolean;
  summary: {
    totalTested: number;
    successCount: number;
    errorCount: number;
    workingEndpoints: number;
    creationCandidates: number;
  };
  workingEndpoints: EndpointResult[];
  creationCandidates: EndpointResult[];
  failedEndpoints: EndpointResult[];
  recommendations: string[];
  timestamp: string;
  vpsConfig: {
    host: string;
    port: string;
    tokenLength: number;
  };
}

export const VPSEndpointDiscovery = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[VPS Endpoint Discovery] ${message}`);
  };

  const runDiscovery = async () => {
    setIsRunning(true);
    setLogs([]);
    setDiscoveryResult(null);

    try {
      addLog("🔍 Iniciando descoberta automática de endpoints VPS...");
      
      const { data, error } = await supabase.functions.invoke('vps_endpoint_discovery');

      if (error) {
        throw new Error(`Erro na descoberta: ${error.message}`);
      }

      if (data?.success) {
        setDiscoveryResult(data);
        addLog(`✅ Descoberta concluída: ${data.summary.successCount}/${data.summary.totalTested} endpoints funcionais`);
        
        if (data.creationCandidates.length > 0) {
          addLog(`🎯 Encontrados ${data.creationCandidates.length} candidatos para criação de instâncias`);
          toast.success(`Descoberta concluída! ${data.creationCandidates.length} endpoints de criação encontrados.`);
        } else {
          addLog("❌ Nenhum endpoint de criação encontrado");
          toast.warning("Descoberta concluída, mas nenhum endpoint de criação foi encontrado.");
        }
      } else {
        throw new Error(data?.error || 'Descoberta falhou');
      }

    } catch (error: any) {
      addLog(`💥 Erro na descoberta: ${error.message}`);
      toast.error(`Erro na descoberta: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: number, success?: boolean) => {
    if (success || (status >= 200 && status < 300)) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (status >= 400 && status < 500) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: number, success?: boolean) => {
    if (success || (status >= 200 && status < 300)) {
      return <Badge variant="default">SUCESSO</Badge>;
    } else if (status >= 400 && status < 500) {
      return <Badge variant="destructive">ERRO</Badge>;
    } else {
      return <Badge variant="secondary">FALHA</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    };
    return <Badge variant={variants[priority as keyof typeof variants] as any}>{priority.toUpperCase()}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: 'bg-green-100 text-green-800',
      POST: 'bg-blue-100 text-blue-800',
      PUT: 'bg-yellow-100 text-yellow-800',
      DELETE: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-mono ${colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {method}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-purple-600" />
            Descoberta Automática de Endpoints VPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              Esta ferramenta testa automaticamente todos os endpoints possíveis da VPS para descobrir 
              a estrutura real da API e identificar os endpoints corretos para criação de instâncias.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={runDiscovery}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Descobrindo Endpoints...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Executar Descoberta Completa
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resumo dos Resultados */}
      {discoveryResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Resumo da Descoberta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{discoveryResult.summary.totalTested}</div>
                <div className="text-xs text-muted-foreground">Total Testados</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{discoveryResult.summary.successCount}</div>
                <div className="text-xs text-muted-foreground">Sucessos</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{discoveryResult.summary.workingEndpoints}</div>
                <div className="text-xs text-muted-foreground">Funcionais</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{discoveryResult.summary.creationCandidates}</div>
                <div className="text-xs text-muted-foreground">Candidatos</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Descoberta executada em: {new Date(discoveryResult.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidatos para Criação */}
      {discoveryResult?.creationCandidates && discoveryResult.creationCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              🎯 Candidatos para Criação de Instâncias ({discoveryResult.creationCandidates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {discoveryResult.creationCandidates.map((endpoint, index) => (
                <div key={index} className="border rounded-lg p-4 bg-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(endpoint.status)}
                      {getMethodBadge(endpoint.method)}
                      <code className="font-mono text-sm">{endpoint.endpoint}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(endpoint.priority)}
                      {getStatusBadge(endpoint.status)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{endpoint.description}</div>
                  {endpoint.responseSample && (
                    <details className="text-xs">
                      <summary className="cursor-pointer">Ver resposta da API</summary>
                      <pre className="mt-2 p-2 bg-white rounded overflow-auto max-h-20">
                        {endpoint.responseSample}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoints Funcionais */}
      {discoveryResult?.workingEndpoints && discoveryResult.workingEndpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              ✅ Endpoints Funcionais ({discoveryResult.workingEndpoints.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {discoveryResult.workingEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(endpoint.status)}
                    {getMethodBadge(endpoint.method)}
                    <code className="font-mono text-sm">{endpoint.endpoint}</code>
                    <span className="text-xs text-muted-foreground">({endpoint.description})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(endpoint.priority)}
                    <span className="text-xs text-muted-foreground">{endpoint.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {discoveryResult?.recommendations && discoveryResult.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              🔧 Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {discoveryResult.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-yellow-50 rounded-lg text-sm">
                  {rec}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Logs de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32 w-full">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono bg-black/5 p-2 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
