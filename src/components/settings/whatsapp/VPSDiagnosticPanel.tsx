
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Server,
  Zap,
  RefreshCw,
  Network
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiagnosticResult {
  id: string;
  timestamp: string;
  test: string;
  status: 'pending' | 'success' | 'error';
  duration?: number;
  details?: any;
}

export const VPSDiagnosticPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);

  const addDiagnostic = (test: string, status: 'pending' | 'success' | 'error', details?: any, duration?: number) => {
    const diagnostic: DiagnosticResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      test,
      status,
      details,
      duration
    };
    
    setDiagnostics(prev => [diagnostic, ...prev.slice(0, 19)]);
  };

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    
    try {
      // TESTE 1: Edge Function Health Check
      addDiagnostic('Edge Function - Health Check', 'pending');
      const startTime1 = Date.now();
      
      const { data: healthData, error: healthError } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: { action: 'diagnostic_health' }
      });
      
      const duration1 = Date.now() - startTime1;
      
      if (healthError) {
        addDiagnostic('Edge Function - Health Check', 'error', { error: healthError.message }, duration1);
      } else {
        addDiagnostic('Edge Function - Health Check', 'success', healthData, duration1);
      }

      // TESTE 2: VPS Connection Test
      addDiagnostic('VPS - Connection Test', 'pending');
      const startTime2 = Date.now();
      
      const { data: vpsData, error: vpsError } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: { action: 'diagnostic_vps' }
      });
      
      const duration2 = Date.now() - startTime2;
      
      if (vpsError) {
        addDiagnostic('VPS - Connection Test', 'error', { error: vpsError.message }, duration2);
      } else {
        addDiagnostic('VPS - Connection Test', vpsData?.success ? 'success' : 'error', vpsData, duration2);
      }

      // TESTE 3: Database Test
      addDiagnostic('Database - Instance Query', 'pending');
      const startTime3 = Date.now();
      
      const { data: dbData, error: dbError } = await supabase
        .from('whatsapp_instances')
        .select('count(*)')
        .limit(1);
      
      const duration3 = Date.now() - startTime3;
      
      if (dbError) {
        addDiagnostic('Database - Instance Query', 'error', { error: dbError.message }, duration3);
      } else {
        addDiagnostic('Database - Instance Query', 'success', { result: 'Connection OK' }, duration3);
      }

      // TESTE 4: Create Instance Test (Safe Mode)
      addDiagnostic('Create Instance - Safe Mode', 'pending');
      const startTime4 = Date.now();
      
      const { data: createData, error: createError } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: { 
          action: 'diagnostic_create',
          testMode: true 
        }
      });
      
      const duration4 = Date.now() - startTime4;
      
      if (createError) {
        addDiagnostic('Create Instance - Safe Mode', 'error', { error: createError.message }, duration4);
      } else {
        addDiagnostic('Create Instance - Safe Mode', createData?.success ? 'success' : 'error', createData, duration4);
      }

    } catch (error: any) {
      addDiagnostic('Diagnostic System', 'error', { error: error.message });
      toast.error('Erro no diagnóstico: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600 text-white">✅ Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">❌ Erro</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">⏳ Testando</Badge>;
      default:
        return <Badge variant="outline">? Status</Badge>;
    }
  };

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-600" />
            <span>Diagnóstico VPS & Sistema</span>
          </div>
          <Button
            onClick={runFullDiagnostic}
            disabled={isRunning}
            variant="outline"
            className="gap-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Diagnosticando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Executar Diagnóstico
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {diagnostics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum diagnóstico executado ainda</p>
            <p className="text-sm">Clique em "Executar Diagnóstico" para testar o sistema</p>
          </div>
        ) : (
          <ScrollArea className="h-96 w-full">
            <div className="space-y-3">
              {diagnostics.map((diagnostic) => (
                <div
                  key={diagnostic.id}
                  className="p-4 border rounded-lg bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(diagnostic.status)}
                      <span className="font-medium text-sm">{diagnostic.test}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(diagnostic.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(diagnostic.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  {diagnostic.duration && (
                    <div className="text-xs text-gray-600 mb-2">
                      Duração: {diagnostic.duration}ms
                    </div>
                  )}
                  
                  {diagnostic.details && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <pre className="text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(diagnostic.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
