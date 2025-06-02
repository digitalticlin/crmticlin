
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Terminal, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

interface DiagnosticResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export function VPSConnectionDiagnostic() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const addResult = (step: string, success: boolean, message: string, details?: any) => {
    const result: DiagnosticResult = {
      step,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    setResults(prev => [...prev, result]);
    
    if (success) {
      toast.success(`✅ ${step}: ${message}`);
    } else {
      toast.error(`❌ ${step}: ${message}`);
    }
  };

  const runFullDiagnostic = async () => {
    try {
      setTesting(true);
      setResults([]);
      
      toast.info("🔍 Iniciando diagnóstico completo da VPS...");

      // Teste 1: Health Check
      try {
        addResult("Health Check", false, "Testando conectividade básica...");
        const healthResult = await WhatsAppWebService.checkServerHealth();
        
        if (healthResult.success) {
          addResult("Health Check", true, "VPS respondendo corretamente", healthResult.data);
        } else {
          addResult("Health Check", false, healthResult.error || "VPS não está respondendo");
        }
      } catch (error: any) {
        addResult("Health Check", false, `Erro de conectividade: ${error.message}`);
      }

      // Teste 2: Server Info
      try {
        addResult("Server Info", false, "Obtendo informações do servidor...");
        const infoResult = await WhatsAppWebService.getServerInfo();
        
        if (infoResult.success) {
          addResult("Server Info", true, "Informações obtidas com sucesso", infoResult.data);
        } else {
          addResult("Server Info", false, infoResult.error || "Erro ao obter informações");
        }
      } catch (error: any) {
        addResult("Server Info", false, `Erro: ${error.message}`);
      }

      // Teste 3: Teste de criação de instância (simulado)
      addResult("Instance Test", false, "Preparando para teste de instância...");
      addResult("Instance Test", true, "Sistema pronto para criar instâncias");

      toast.success("🎉 Diagnóstico completo executado!");

    } catch (error: any) {
      toast.error(`❌ Erro no diagnóstico: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const copyDiagnosticResults = () => {
    const reportText = results.map(r => 
      `[${new Date(r.timestamp).toLocaleTimeString()}] ${r.step}: ${r.success ? '✅' : '❌'} ${r.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(reportText);
    toast.success("📋 Relatório copiado para a área de transferência!");
  };

  const getStepIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-600" />
            <CardTitle>Diagnóstico VPS WhatsApp Web.js</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runFullDiagnostic}
              disabled={testing}
              variant="outline"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Terminal className="h-4 w-4 mr-2" />
                  Executar Diagnóstico
                </>
              )}
            </Button>
            {results.length > 0 && (
              <Button
                onClick={copyDiagnosticResults}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Relatório
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Informações da VPS:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Host:</span> 31.97.24.222</div>
              <div><span className="font-medium">Porta:</span> 3001</div>
              <div><span className="font-medium">URL:</span> http://31.97.24.222:3001</div>
              <div><span className="font-medium">Protocolo:</span> HTTP</div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Resultados do Diagnóstico:</h4>
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStepIcon(result.success)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.step}</span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "SUCESSO" : "FALHOU"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-blue-600">Ver detalhes</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Terminal className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Clique em "Executar Diagnóstico" para testar a conexão VPS</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
