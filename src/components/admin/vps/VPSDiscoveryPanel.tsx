
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Search, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  Server,
  Network,
  AlertCircle
} from "lucide-react";

export const VPSDiscoveryPanel = () => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const runDiscovery = async () => {
    setIsDiscovering(true);
    setResults(null);
    
    try {
      console.log('[VPS Discovery] 🔍 Iniciando descoberta completa...');
      
      const { data, error } = await supabase.functions.invoke('vps_discovery');

      if (error) {
        throw new Error(error.message);
      }

      setResults(data);
      
      if (data.success) {
        const workingCount = data.summary.workingEndpoints;
        const totalCount = data.summary.totalTests;
        
        if (workingCount > 0) {
          toast.success(`Descoberta concluída! ${workingCount}/${totalCount} endpoints funcionando`, {
            description: data.recommendation ? `Recomendação: ${data.recommendation.config}` : 'VPS configurada'
          });
        } else {
          toast.warning('VPS não respondeu em nenhuma configuração', {
            description: 'Verifique se a VPS está online e acessível'
          });
        }
      } else {
        throw new Error(data.error || 'Falha na descoberta');
      }

    } catch (error: any) {
      console.error('[VPS Discovery] ❌ Erro:', error);
      toast.error('Erro na descoberta da VPS', {
        description: error.message
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-500 hover:bg-green-600">✅ OK</Badge>
    ) : (
      <Badge variant="destructive">❌ FALHA</Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-500" />
          Descoberta Automática da VPS
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Testa automaticamente todas as configurações possíveis da VPS
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Botão de Descoberta */}
        <div className="flex justify-center">
          <Button
            onClick={runDiscovery}
            disabled={isDiscovering}
            size="lg"
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isDiscovering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Descobrindo configurações...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Iniciar Descoberta
              </>
            )}
          </Button>
        </div>

        {/* Resultados da Descoberta */}
        {results && (
          <div className="space-y-4">
            {/* Resumo */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Network className="h-5 w-5 text-blue-500" />
                  Resumo da Descoberta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{results.summary.totalTests}</div>
                    <div className="text-xs text-muted-foreground">Total de Testes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{results.summary.workingEndpoints}</div>
                    <div className="text-xs text-muted-foreground">Funcionando</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {results.summary.totalTests - results.summary.workingEndpoints}
                    </div>
                    <div className="text-xs text-muted-foreground">Falharam</div>
                  </div>
                </div>

                {results.recommendation && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 font-medium text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      Configuração Recomendada
                    </div>
                    <div className="text-sm text-green-700 mt-1">
                      <p><strong>Config:</strong> {results.recommendation.config}</p>
                      <p><strong>Endpoint:</strong> {results.recommendation.endpoint}</p>
                      <p><strong>Método:</strong> {results.recommendation.method}</p>
                    </div>
                  </div>
                )}

                {results.summary.workingEndpoints === 0 && (
                  <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 font-medium text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      Nenhuma Configuração Funcionando
                    </div>
                    <div className="text-sm text-red-700 mt-1">
                      Verifique se a VPS está online e acessível no IP 31.97.24.222
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resultados Detalhados */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg mb-3">Resultados Detalhados</h3>
              
              {results.allResults.map((result: any, index: number) => (
                <Collapsible
                  key={`${result.config}-${result.endpoint}-${index}`}
                  open={expandedItems.has(`result-${index}`)}
                  onOpenChange={() => toggleExpanded(`result-${index}`)}
                >
                  <CollapsibleTrigger asChild>
                    <Card className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      result.success ? 'border-green-200' : 'border-red-200'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.success)}
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {result.config} - {result.endpoint}
                                {getStatusBadge(result.success)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {result.method} {result.path}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.status && (
                              <Badge variant="outline">
                                HTTP {result.status}
                              </Badge>
                            )}
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <Card className="mt-2 ml-4">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Configuração:</label>
                            <div className="text-sm">{result.config}</div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Endpoint:</label>
                            <div className="text-sm font-mono">{result.method} {result.path}</div>
                          </div>

                          {result.payload && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Payload:</label>
                              <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                                {JSON.stringify(result.payload, null, 2)}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Resposta:</label>
                            <div className={`text-sm font-mono p-2 rounded max-h-40 overflow-auto ${
                              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                            }`}>
                              {result.error ? result.error : JSON.stringify(result.data, null, 2)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
