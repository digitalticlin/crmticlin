
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, Copy, RefreshCw } from "lucide-react";

interface DiscoveryResults {
  success: boolean;
  data: {
    timestamp: string;
    vps_host: string;
    tested_ports: number[];
    discoveries: Array<{
      port: number;
      baseUrl: string;
      responding: boolean;
      endpoints: Array<{
        endpoint: string;
        method: string;
        description: string;
        status: number;
        success: boolean;
        working: boolean;
        response_data?: any;
        error?: string;
      }>;
      server_info?: any;
    }>;
    working_endpoints: Array<{
      endpoint: string;
      method: string;
      description: string;
      status: number;
      full_url: string;
      port: number;
      working: boolean;
      response_data?: any;
    }>;
    recommended_config: {
      baseUrl: string;
      port: number;
      endpoints: {
        health: string;
        create: string;
        qr: string;
        instances: string;
        delete: string;
      };
      payload_format: any;
      server_type: string;
    } | null;
    whatsapp_structure: {
      create_endpoints: any[];
      qr_endpoints: any[];
      list_endpoints: any[];
      delete_endpoints: any[];
      status_endpoints: any[];
    };
  };
  summary: {
    total_ports_tested: number;
    responding_ports: number;
    working_endpoints: number;
    recommended_base_url: string;
    next_steps: string[];
  };
}

export const VPSEndpointDiscovery = () => {
  const [discovering, setDiscovering] = useState(false);
  const [results, setResults] = useState<DiscoveryResults | null>(null);

  const runDiscovery = async () => {
    try {
      setDiscovering(true);
      toast.info("Iniciando descoberta de endpoints da VPS...");

      const { data, error } = await supabase.functions.invoke('vps_endpoint_discovery', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

      setResults(data);
      
      if (data.success) {
        const summary = data.summary;
        toast.success(
          `Descoberta concluída! ${summary.working_endpoints} endpoints funcionando em ${summary.responding_ports} portas.`
        );
      } else {
        toast.error(`Descoberta falhou: ${data.error}`);
      }

    } catch (error: any) {
      console.error('Erro na descoberta:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setDiscovering(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência!`);
  };

  const getStatusBadge = (working: boolean) => {
    return (
      <Badge variant={working ? "default" : "destructive"}>
        {working ? "FUNCIONANDO" : "FALHOU"}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      'GET': 'bg-blue-100 text-blue-800',
      'POST': 'bg-green-100 text-green-800',
      'DELETE': 'bg-red-100 text-red-800',
      'PUT': 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {method}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <CardTitle>Descoberta de Endpoints VPS</CardTitle>
            </div>
            <Button 
              onClick={runDiscovery} 
              disabled={discovering}
              className="flex items-center gap-2"
            >
              {discovering ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Descobrindo...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Descobrir Endpoints
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Executa uma varredura completa da VPS testando múltiplas portas e endpoints para 
            identificar a estrutura exata da API WhatsApp disponível.
          </p>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.data.recommended_config ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Resumo da Descoberta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.summary.total_ports_tested}
                  </div>
                  <div className="text-sm text-muted-foreground">Portas Testadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.summary.responding_ports}
                  </div>
                  <div className="text-sm text-muted-foreground">Portas Respondendo</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {results.summary.working_endpoints}
                  </div>
                  <div className="text-sm text-muted-foreground">Endpoints Funcionando</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.data.recommended_config?.server_type || 'Desconhecido'}
                  </div>
                  <div className="text-sm text-muted-foreground">Tipo do Servidor</div>
                </div>
              </div>

              {results.data.recommended_config && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">✅ Configuração Recomendada Encontrada!</h4>
                  <p className="text-sm text-green-600">
                    Base URL: <code className="bg-green-100 px-1 rounded">{results.data.recommended_config.baseUrl}</code>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuração Recomendada */}
          {results.data.recommended_config && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Configuração Recomendada</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(results.data.recommended_config, null, 2), 'Configuração')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Config
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Base URL e Porta</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p><strong>URL:</strong> {results.data.recommended_config.baseUrl}</p>
                      <p><strong>Porta:</strong> {results.data.recommended_config.port}</p>
                      <p><strong>Tipo:</strong> {results.data.recommended_config.server_type}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Endpoints Identificados</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                      <p><strong>Health:</strong> {results.data.recommended_config.endpoints.health}</p>
                      <p><strong>Create:</strong> {results.data.recommended_config.endpoints.create}</p>
                      <p><strong>QR Code:</strong> {results.data.recommended_config.endpoints.qr}</p>
                      <p><strong>List:</strong> {results.data.recommended_config.endpoints.instances}</p>
                      <p><strong>Delete:</strong> {results.data.recommended_config.endpoints.delete}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Endpoints Funcionando */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoints Funcionando ({results.data.working_endpoints.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.data.working_endpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getMethodBadge(endpoint.method)}
                      <span className="font-mono text-sm">{endpoint.full_url}</span>
                      <span className="text-xs text-muted-foreground">({endpoint.description})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Porta {endpoint.port}</Badge>
                      <Badge variant="outline">Status {endpoint.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estrutura WhatsApp */}
          <Card>
            <CardHeader>
              <CardTitle>Estrutura WhatsApp Identificada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Criar Instância ({results.data.whatsapp_structure.create_endpoints.length})</h4>
                  <div className="space-y-1">
                    {results.data.whatsapp_structure.create_endpoints.map((ep, i) => (
                      <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                        {getMethodBadge(ep.method)} {ep.endpoint}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">QR Code ({results.data.whatsapp_structure.qr_endpoints.length})</h4>
                  <div className="space-y-1">
                    {results.data.whatsapp_structure.qr_endpoints.map((ep, i) => (
                      <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                        {getMethodBadge(ep.method)} {ep.endpoint}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Deletar ({results.data.whatsapp_structure.delete_endpoints.length})</h4>
                  <div className="space-y-1">
                    {results.data.whatsapp_structure.delete_endpoints.map((ep, i) => (
                      <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                        {getMethodBadge(ep.method)} {ep.endpoint}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Próximos Passos */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.summary.next_steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground">
            Descoberta executada em: {new Date(results.data.timestamp).toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  );
};
