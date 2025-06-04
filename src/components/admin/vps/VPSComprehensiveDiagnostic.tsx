
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Server, 
  Wifi, 
  Zap,
  RefreshCw,
  Bug,
  Settings,
  MessageSquare
} from "lucide-react";

interface DiagnosticTest {
  test: string;
  status: 'success' | 'error' | 'warning';
  details: any;
  duration: number;
  timestamp: string;
}

interface DiagnosticResult {
  testType: string;
  totalDuration: number;
  summary: {
    totalTests: number;
    successCount: number;
    errorCount: number;
    warningCount: number;
    overallStatus: string;
  };
  tests: DiagnosticTest[];
  timestamp: string;
  recommendations: Array<{
    priority: string;
    issue: string;
    solution: string;
  }>;
}

export const VPSComprehensiveDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [activeTest, setActiveTest] = useState<string>('full');

  const runDiagnostic = async (testType: string) => {
    try {
      setIsRunning(true);
      setActiveTest(testType);
      
      toast.info(`Executando diagnóstico: ${getTestLabel(testType)}...`);

      const { data, error } = await supabase.functions.invoke('vps_comprehensive_diagnostic', {
        body: { testType }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        setResults(data.diagnostic);
        toast.success(`Diagnóstico ${getTestLabel(testType)} concluído!`);
      } else {
        throw new Error(data.error || 'Erro no diagnóstico');
      }

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestLabel = (testType: string) => {
    const labels = {
      full: 'Completo',
      connectivity: 'Conectividade',
      instances: 'Instâncias',
      sync: 'Sincronização',
      auth: 'Autenticação',
      performance: 'Performance',
      webhook: 'Webhook'
    };
    return labels[testType as keyof typeof labels] || testType;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRÍTICO': return 'text-red-600 border-red-200 bg-red-50';
      case 'ALTO': return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'MÉDIO': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      default: return 'text-blue-600 border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de Diagnóstico */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-blue-600" />
              <CardTitle>Diagnóstico Abrangente VPS</CardTitle>
            </div>
            {results && (
              <div className="flex items-center gap-2">
                {getStatusIcon(results.summary.overallStatus)}
                <span className="text-sm text-muted-foreground">
                  {results.timestamp && new Date(results.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => runDiagnostic('full')}
              disabled={isRunning}
              variant={activeTest === 'full' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Completo
            </Button>
            <Button
              onClick={() => runDiagnostic('connectivity')}
              disabled={isRunning}
              variant={activeTest === 'connectivity' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Wifi className="h-4 w-4" />
              Conectividade
            </Button>
            <Button
              onClick={() => runDiagnostic('instances')}
              disabled={isRunning}
              variant={activeTest === 'instances' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Server className="h-4 w-4" />
              Instâncias
            </Button>
            <Button
              onClick={() => runDiagnostic('sync')}
              disabled={isRunning}
              variant={activeTest === 'sync' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Sync
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Button
              onClick={() => runDiagnostic('auth')}
              disabled={isRunning}
              variant={activeTest === 'auth' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Auth
            </Button>
            <Button
              onClick={() => runDiagnostic('performance')}
              disabled={isRunning}
              variant={activeTest === 'performance' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Performance
            </Button>
            <Button
              onClick={() => runDiagnostic('webhook')}
              disabled={isRunning}
              variant={activeTest === 'webhook' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Webhook
            </Button>
          </div>

          {isRunning && (
            <div className="flex items-center justify-center gap-2 mt-4 p-4 bg-blue-50 rounded-lg">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-blue-700">
                Executando diagnóstico {getTestLabel(activeTest)}...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {results && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Resumo</TabsTrigger>
            <TabsTrigger value="tests">Testes</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          {/* Resumo */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(results.summary.overallStatus)}
                  Resumo do Diagnóstico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.summary.totalTests}
                    </div>
                    <div className="text-sm text-muted-foreground">Total de Testes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {results.summary.successCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Sucessos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {results.summary.warningCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Avisos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {results.summary.errorCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Erros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {results.totalDuration}ms
                    </div>
                    <div className="text-sm text-muted-foreground">Duração</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Status Geral</h4>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(results.summary.overallStatus)}
                    <span className="text-sm text-muted-foreground">
                      Diagnóstico executado em {new Date(results.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testes */}
          <TabsContent value="tests">
            <div className="space-y-4">
              {results.tests.map((test, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(test.status)}
                        <CardTitle className="text-lg">{test.test}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(test.status)}
                        <span className="text-sm text-muted-foreground">
                          {test.duration}ms
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto max-h-40">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recomendações */}
          <TabsContent value="recommendations">
            <div className="space-y-4">
              {results.recommendations.length > 0 ? (
                results.recommendations.map((rec, index) => (
                  <Card key={index} className={`border ${getPriorityColor(rec.priority)}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-1">
                          {rec.priority}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{rec.issue}</h4>
                          <p className="text-sm text-muted-foreground">{rec.solution}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-green-600">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Tudo Funcionando!</h3>
                      <p className="text-sm text-muted-foreground">
                        Nenhuma recomendação necessária. O sistema está operando corretamente.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Detalhes */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes Técnicos Completos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
                  <pre className="text-xs overflow-x-auto max-h-96">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
