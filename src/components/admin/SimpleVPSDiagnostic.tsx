
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Server, 
  Loader2,
  Database,
  Wifi,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticResult {
  success: boolean;
  responseTime?: number;
  error?: string;
  timestamp: string;
  details?: any;
}

export const SimpleVPSDiagnostic = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [dbStats, setDbStats] = useState<any>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      console.log('[VPS Diagnostic] 🔧 Executando diagnóstico...');
      
      const startTime = Date.now();
      
      // Teste de conectividade com o banco
      const { data: dbTest, error: dbError } = await supabase
        .from('whatsapp_instances')
        .select('count(*)')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (dbError) {
        setResult({
          success: false,
          error: dbError.message,
          timestamp: new Date().toISOString(),
          responseTime
        });
        toast.error(`Erro no diagnóstico: ${dbError.message}`);
        return;
      }

      // Buscar estatísticas do banco
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('connection_status, created_by_user_id, created_at');

      const stats = {
        totalInstances: instances?.length || 0,
        connectedInstances: instances?.filter(i => 
          i.connection_status === 'connected' || i.connection_status === 'ready'
        ).length || 0,
        orphanedInstances: instances?.filter(i => !i.created_by_user_id).length || 0,
        recentInstances: instances?.filter(i => {
          const createdAt = new Date(i.created_at);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return createdAt > dayAgo;
        }).length || 0
      };

      setDbStats(stats);
      
      setResult({
        success: true,
        responseTime,
        timestamp: new Date().toISOString(),
        details: stats
      });
      
      toast.success('Diagnóstico concluído com sucesso!');
      
    } catch (error: any) {
      console.error('[VPS Diagnostic] ❌ Erro:', error);
      setResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      toast.error(`Erro no diagnóstico: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-800">
                  Diagnóstico de Sistema
                </h2>
                <p className="text-sm text-blue-600">
                  Verificação de conectividade e integridade do banco de dados
                </p>
              </div>
            </div>
            <Badge variant="default" className="bg-blue-600 text-white">
              <Database className="h-3 w-3 mr-1" />
              SUPABASE
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="flex justify-center">
        <Button 
          onClick={runDiagnostic}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8 py-3 text-lg"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Executando Diagnóstico...
            </>
          ) : (
            <>
              <Activity className="h-5 w-5" />
              Executar Diagnóstico
            </>
          )}
        </Button>
      </div>

      {result && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Resultado do Diagnóstico
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? "SUCESSO" : "ERRO"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Banco de Dados</span>
                </div>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={result.success ? "text-green-600" : "text-red-600"}>
                    {result.success ? "Online" : "Erro"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Tempo Resposta</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">
                    {result.responseTime}ms
                  </span>
                </div>
              </div>

              {dbStats && (
                <>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Instâncias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">
                        {dbStats.totalInstances} total
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Conectadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-600 font-medium">
                        {dbStats.connectedInstances}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {dbStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Instâncias Órfãs</span>
                  </div>
                  <div className="text-yellow-700">
                    {dbStats.orphanedInstances} instância(s) sem proprietário
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium">Recentes (24h)</span>
                  </div>
                  <div className="text-indigo-700">
                    {dbStats.recentInstances} instância(s) criadas
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Detalhes Técnicos:</h4>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Timestamp:</span>
                    <p className="text-gray-600">{result.timestamp}</p>
                  </div>
                  <div>
                    <span className="font-medium">Fonte:</span>
                    <p className="text-gray-600">Supabase Database</p>
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span>
                    <p className="text-purple-600 font-medium">Diagnóstico Direto</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className={result.success ? "text-green-600" : "text-red-600"}>
                      {result.success ? "Operacional" : "Com Problemas"}
                    </p>
                  </div>
                </div>
              </div>

              {result.error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Erro Detectado:</span>
                  </div>
                  <p className="text-red-700 text-sm">{result.error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
