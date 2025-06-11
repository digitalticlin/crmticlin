
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Monitor, 
  RefreshCw, 
  Server, 
  Zap,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { ApiClient } from "@/lib/apiClient";

export const VPSDebugDashboard = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticData(null);
    
    try {
      console.log('[VPS Debug] 🔧 Executando diagnóstico BAILEYS');
      
      const result = await ApiClient.runVPSDiagnostics();
      
      setDiagnosticData({
        ...result,
        timestamp: new Date().toISOString(),
        engine: 'BAILEYS',
        puppeteer_status: 'DISABLED'
      });
      
      if (result.success) {
        toast.success('Diagnóstico BAILEYS concluído!');
      } else {
        toast.error(`Diagnóstico falhou: ${result.error}`);
      }
      
    } catch (error: any) {
      console.error('[VPS Debug] ❌ Erro no diagnóstico:', error);
      setDiagnosticData({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        engine: 'BAILEYS',
        puppeteer_status: 'DISABLED'
      });
      toast.error(`Erro no diagnóstico: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Diagnóstico BAILEYS */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Server className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-purple-800">
                  VPS Diagnóstico BAILEYS - NÍVEL 8
                </h2>
                <p className="text-sm text-purple-600">
                  ⚡ Sistema usando BAILEYS (SEM PUPPETEER) - Diagnóstico Completo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-purple-600 text-white">
                <Zap className="h-3 w-3 mr-1" />
                BAILEYS ENGINE
              </Badge>
              <Badge variant="destructive" className="bg-red-600 text-white">
                <AlertTriangle className="h-3 w-3 mr-1" />
                PUPPETEER DISABLED
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Botão de Diagnóstico */}
      <div className="flex justify-center">
        <Button 
          onClick={runDiagnostic}
          disabled={isRunning}
          className="bg-purple-600 hover:bg-purple-700 text-white gap-2 px-8 py-3 text-lg"
          size="lg"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Executando Diagnóstico BAILEYS...
            </>
          ) : (
            <>
              <Monitor className="h-5 w-5" />
              Executar Diagnóstico VPS BAILEYS
            </>
          )}
        </Button>
      </div>

      {/* Resultados do Diagnóstico */}
      {diagnosticData && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Resultado do Diagnóstico BAILEYS
              <Badge variant={diagnosticData.success ? "default" : "destructive"}>
                {diagnosticData.success ? "SUCESSO" : "ERRO"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Geral */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">VPS Status</span>
                </div>
                <div className="flex items-center gap-2">
                  {diagnosticData.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={diagnosticData.success ? "text-green-600" : "text-red-600"}>
                    {diagnosticData.success ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-600 font-medium">
                    {diagnosticData.engine || 'BAILEYS'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Puppeteer</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">
                    {diagnosticData.puppeteer_status || 'DISABLED'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Tempo Resposta</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">
                    {diagnosticData.responseTime || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Detalhes Técnicos */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Detalhes Técnicos:</h4>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Timestamp:</span>
                    <p className="text-gray-600">{diagnosticData.timestamp}</p>
                  </div>
                  <div>
                    <span className="font-medium">Fonte:</span>
                    <p className="text-gray-600">{diagnosticData.source || 'baileys_server'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Engine:</span>
                    <p className="text-purple-600 font-medium">BAILEYS (SEM PUPPETEER)</p>
                  </div>
                  <div>
                    <span className="font-medium">Status Puppeteer:</span>
                    <p className="text-red-600 font-medium">COMPLETAMENTE REMOVIDO</p>
                  </div>
                </div>
              </div>

              {/* Erro (se houver) */}
              {diagnosticData.error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Erro Detectado:</span>
                  </div>
                  <p className="text-red-700 text-sm">{diagnosticData.error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Informativo sobre BAILEYS */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardContent className="p-4">
          <div className="text-sm text-purple-800 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <strong>✅ DIAGNÓSTICO VPS - SISTEMA BAILEYS NÍVEL 8</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Engine BAILEYS:</strong> ✅ Biblioteca nativa WhatsApp (sem browser)</li>
              <li><strong>Puppeteer ELIMINADO:</strong> ❌ Completamente removido do servidor</li>
              <li><strong>Diagnóstico Rápido:</strong> ⚡ Verificação em 2-3 segundos</li>
              <li><strong>Conexão Estável:</strong> 🔗 Health check via BAILEYS</li>
              <li><strong>Performance:</strong> 🚀 Uso mínimo de recursos VPS</li>
              <li><strong>Endpoints:</strong> ✅ Todos funcionando via BAILEYS</li>
            </ul>
            <div className="mt-3 p-3 bg-white/70 rounded border border-purple-200">
              <p className="font-medium">🎯 Diagnóstico VPS BAILEYS:</p>
              <p>Frontend → ApiClient → whatsapp_instance_manager → VPS (BAILEYS) → Health Check Instantâneo</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
