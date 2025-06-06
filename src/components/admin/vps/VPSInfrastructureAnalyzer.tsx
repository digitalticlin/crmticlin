
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Loader2, 
  Search, 
  Server, 
  CheckCircle, 
  XCircle, 
  ChevronDown,
  Clock,
  Terminal,
  Database,
  Network,
  Settings,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalysisResult {
  id: string;
  name: string;
  description: string;
  command?: string;
  success: boolean;
  output: any;
  duration: number;
  timestamp: string;
}

interface AnalysisSummary {
  total_steps: number;
  successful_steps: number;
  failed_steps: number;
  total_duration: number;
  analysis_timestamp: string;
  analysis_method: string;
  connectivity_status: string;
}

export const VPSInfrastructureAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setResults([]);
    setSummary(null);
    
    try {
      console.log('[VPS Infrastructure] 🔍 Iniciando análise SSH...');
      
      const { data, error } = await supabase.functions.invoke('vps_infrastructure_analysis', {
        body: { action: 'analyze_infrastructure' }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setResults(data.detailed_results);
        setSummary(data.summary);
        
        const status = data.summary.connectivity_status === 'PARTIAL' ? '🟡 PARCIAL' : 
                      data.summary.successful_steps > 0 ? '🟢 CONECTADO' : '🔴 FALHOU';
        
        toast.success(`Análise SSH completa! Status: ${status}`, {
          description: `${data.summary.successful_steps}/${data.summary.total_steps} comandos executados (${Math.round(data.summary.total_duration / 1000)}s)`
        });
      } else {
        throw new Error(data.error || 'Falha na análise');
      }

    } catch (error: any) {
      console.error('[VPS Infrastructure] ❌ Erro na análise:', error);
      toast.error('Erro na análise da infraestrutura', {
        description: error.message
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getStepIcon = (id: string) => {
    if (id.includes('system') || id.includes('info')) return <Server className="h-4 w-4" />;
    if (id.includes('node') || id.includes('version')) return <Database className="h-4 w-4" />;
    if (id.includes('pm2') || id.includes('process')) return <Settings className="h-4 w-4" />;
    if (id.includes('port') || id.includes('network')) return <Network className="h-4 w-4" />;
    if (id.includes('whatsapp') || id.includes('session')) return <Zap className="h-4 w-4" />;
    if (id.includes('files') || id.includes('directory')) return <Terminal className="h-4 w-4" />;
    return <Search className="h-4 w-4" />;
  };

  const formatDuration = (duration: number) => {
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`;
  };

  const getConnectivityBadge = (status: string) => {
    if (status === 'PARTIAL') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          🟡 CONECTIVIDADE PARCIAL
        </Badge>
      );
    }
    return status === 'CONNECTED' ? (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        🟢 VPS CONECTADA
      </Badge>
    ) : (
      <Badge variant="destructive">
        🔴 VPS DESCONECTADA
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-blue-500" />
          Análise SSH da Infraestrutura VPS
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Diagnóstico via comandos SSH - Execução direta na VPS
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Botão de Análise */}
        <div className="flex justify-center">
          <Button
            onClick={startAnalysis}
            disabled={isAnalyzing}
            size="lg"
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando comandos SSH...
              </>
            ) : (
              <>
                <Terminal className="h-4 w-4 mr-2" />
                Iniciar Análise SSH
              </>
            )}
          </Button>
        </div>

        {/* Resumo da Análise */}
        {summary && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="h-5 w-5 text-blue-500" />
                Resultado da Análise SSH
                {getConnectivityBadge(summary.connectivity_status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.total_steps}</div>
                  <div className="text-xs text-muted-foreground">Total de Comandos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{summary.successful_steps}</div>
                  <div className="text-xs text-muted-foreground">Bem-sucedidos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{summary.failed_steps}</div>
                  <div className="text-xs text-muted-foreground">Falharam</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(summary.total_duration / 1000)}s
                  </div>
                  <div className="text-xs text-muted-foreground">Duração Total</div>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="text-xs text-muted-foreground text-center">
                Método: {summary.analysis_method} • {new Date(summary.analysis_timestamp).toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados Detalhados */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg mb-3">Resultados dos Comandos SSH</h3>
            
            {results.map((result) => (
              <Collapsible
                key={result.id}
                open={expandedItems.has(result.id)}
                onOpenChange={() => toggleExpanded(result.id)}
              >
                <CollapsibleTrigger asChild>
                  <Card className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    result.success ? 'border-green-200' : 'border-red-200'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStepIcon(result.id)}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {result.name}
                              {result.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(result.duration)}
                          </Badge>
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
                        {result.command && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Comando SSH:</label>
                            <div className="bg-gray-900 text-green-400 p-2 rounded text-sm font-mono mt-1">
                              $ {result.command}
                            </div>
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Resultado:</label>
                          <div className={`p-3 rounded mt-1 text-sm font-mono whitespace-pre-wrap max-h-60 overflow-auto ${
                            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                          }`}>
                            {typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2)}
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Executado em: {new Date(result.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
