
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
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AnalysisResult {
  id: string;
  name: string;
  description: string;
  command: string;
  success: boolean;
  output: string;
  duration: number;
  timestamp: string;
}

interface AnalysisSummary {
  total_steps: number;
  successful_steps: number;
  failed_steps: number;
  total_duration: number;
  analysis_timestamp: string;
  vps_hostname: string;
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
      console.log('[VPS Infrastructure] 🔍 Iniciando análise completa...');
      
      const { data, error } = await supabase.functions.invoke('vps_infrastructure_analysis', {
        body: { action: 'analyze_infrastructure' }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setResults(data.detailed_results);
        setSummary(data.summary);
        
        toast.success(`Análise completa! ${data.summary.successful_steps}/${data.summary.total_steps} etapas bem-sucedidas`, {
          description: `Duração total: ${Math.round(data.summary.total_duration / 1000)}s`
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
    if (id.includes('system') || id.includes('process')) return <Server className="h-4 w-4" />;
    if (id.includes('port') || id.includes('http')) return <Network className="h-4 w-4" />;
    if (id.includes('config') || id.includes('env')) return <Settings className="h-4 w-4" />;
    if (id.includes('package') || id.includes('dependencies')) return <Database className="h-4 w-4" />;
    return <Terminal className="h-4 w-4" />;
  };

  const formatDuration = (duration: number) => {
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-500" />
          Análise Completa da Infraestrutura VPS
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Diagnóstico abrangente do Node.js, WhatsApp Web.js, endpoints, tokens e configurações
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
                Analisando Infraestrutura...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Iniciar Análise Completa
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
                Resumo da Análise - {summary.vps_hostname}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{summary.total_steps}</div>
                  <div className="text-xs text-muted-foreground">Total de Etapas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{summary.successful_steps}</div>
                  <div className="text-xs text-muted-foreground">Bem-sucedidas</div>
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
            </CardContent>
          </Card>
        )}

        {/* Resultados Detalhados */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-lg mb-3">Resultados Detalhados</h3>
            
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
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Comando:</label>
                          <div className="bg-gray-100 p-2 rounded text-sm font-mono mt-1">
                            {result.command}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Resultado:</label>
                          <div className={`p-3 rounded mt-1 text-sm font-mono whitespace-pre-wrap max-h-60 overflow-auto ${
                            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                          }`}>
                            {result.output || 'Nenhuma saída'}
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
