
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, PlayCircle, RefreshCw, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  success: boolean;
  message: string;
  details: string;
  duration: number;
}

export const SimpleVPSDiagnostic = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const executeVPSTest = async () => {
    setIsExecuting(true);
    setResult(null);
    
    const startTime = Date.now();
    
    try {
      console.log('[Simple VPS Test] Iniciando teste de conectividade VPS...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'check_server' }
      });

      const duration = Date.now() - startTime;

      if (error) {
        console.error('[Simple VPS Test] Erro:', error);
        setResult({
          success: false,
          message: "Falha na conexão com VPS",
          details: `Erro: ${error.message}`,
          duration
        });
        return;
      }

      console.log('[Simple VPS Test] Sucesso:', data);
      setResult({
        success: true,
        message: "VPS conectada e funcionando",
        details: `Servidor WhatsApp Web.js operacional. Status: ${data?.status || 'OK'}`,
        duration
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[Simple VPS Test] Exceção:', error);
      setResult({
        success: false,
        message: "Erro inesperado",
        details: `Exceção: ${error.message}`,
        duration
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-500" />
            Teste de Conexão VPS
          </CardTitle>
          <p className="text-muted-foreground">
            Teste simples para verificar se a VPS está conectada e funcionando
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={executeVPSTest}
            disabled={isExecuting}
            size="lg"
            className="w-full"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Testando Conexão...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Testar Conexão VPS
              </>
            )}
          </Button>

          {result && (
            <Card className={`border ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">{result.message}</span>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Sucesso" : "Falha"}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{result.details}</p>
                <p className="text-xs text-gray-500">Duração: {result.duration}ms</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
