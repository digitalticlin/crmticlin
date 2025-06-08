
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Wrench, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CorrectionResult {
  success: boolean;
  discovered_config?: {
    working_token: string;
    token_masked: string;
    base_url: string;
    endpoints: Record<string, any>;
  };
  recommendations?: string[];
  error?: string;
}

export const VPSAutoCorrector = () => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<CorrectionResult | null>(null);

  const handleDiscoverConfig = async () => {
    setIsDiscovering(true);
    setCorrectionResult(null);

    try {
      console.log('[VPS Auto Corrector] 🔧 Iniciando descoberta automática...');

      const { data, error } = await supabase.functions.invoke('vps_auto_corrector', {
        body: {
          action: 'discover_working_config'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('[VPS Auto Corrector] 📊 Resultado da descoberta:', data);
      setCorrectionResult(data);

      if (data.success) {
        toast.success('Configuração VPS descoberta com sucesso!', { duration: 8000 });
      } else {
        toast.error(`Falha na descoberta: ${data.error}`, { duration: 8000 });
      }

    } catch (error: any) {
      console.error('[VPS Auto Corrector] ❌ Erro:', error);
      toast.error(`Erro na descoberta: ${error.message}`, { duration: 8000 });
      setCorrectionResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleTestInstanceCreation = async () => {
    setIsTesting(true);

    try {
      console.log('[VPS Auto Corrector] 🧪 Testando criação de instância...');

      const { data, error } = await supabase.functions.invoke('vps_auto_corrector', {
        body: {
          action: 'test_instance_creation'
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('[VPS Auto Corrector] 📊 Resultado do teste:', data);

      if (data.success) {
        toast.success('Teste de criação de instância bem-sucedido!', { duration: 8000 });
      } else {
        toast.error(`Teste falhou: ${data.error || 'Erro desconhecido'}`, { duration: 8000 });
      }

    } catch (error: any) {
      console.error('[VPS Auto Corrector] ❌ Erro no teste:', error);
      toast.error(`Erro no teste: ${error.message}`, { duration: 8000 });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Wrench className="h-5 w-5" />
          Correção Automática VPS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-700">
          <p>🔧 <strong>Objetivo:</strong> Descobrir automaticamente a configuração correta da VPS</p>
          <p>🎯 <strong>Correções:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Encontrar token de autenticação funcional</li>
            <li>Mapear endpoints corretos da API</li>
            <li>Testar conectividade e criação de instâncias</li>
            <li>Atualizar configuração automaticamente</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={handleDiscoverConfig}
            disabled={isDiscovering}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isDiscovering ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Descobrindo...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Descobrir Configuração
              </>
            )}
          </Button>

          <Button
            onClick={handleTestInstanceCreation}
            disabled={isTesting}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Testar Criação
              </>
            )}
          </Button>
        </div>

        {correctionResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status da Descoberta:</span>
              {correctionResult.success ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Sucesso
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Falha
                </Badge>
              )}
            </div>

            {correctionResult.success && correctionResult.discovered_config && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    ✅ Configuração Descoberta
                  </h4>
                  <div className="text-xs text-green-700 space-y-1">
                    <p><strong>Token Funcional:</strong> {correctionResult.discovered_config.token_masked}</p>
                    <p><strong>Base URL:</strong> {correctionResult.discovered_config.base_url}</p>
                    <p><strong>Endpoints Testados:</strong> {Object.keys(correctionResult.discovered_config.endpoints).length}</p>
                  </div>
                </div>

                {correctionResult.discovered_config.endpoints && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      🎯 Endpoints Mapeados
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(correctionResult.discovered_config.endpoints).map(([name, endpoint]: [string, any]) => (
                        <div key={name} className="text-xs text-blue-700 flex items-center justify-between">
                          <span>{name}: {endpoint.method} {endpoint.path}</span>
                          <Badge variant={endpoint.working ? "default" : "destructive"} className="text-xs">
                            {endpoint.status || (endpoint.working ? "OK" : "ERRO")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {correctionResult.recommendations && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                      💡 Recomendações
                    </h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {correctionResult.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!correctionResult.success && correctionResult.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  ❌ Erro na Descoberta
                </h4>
                <p className="text-xs text-red-700">{correctionResult.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <p><strong>💡 Como funciona:</strong></p>
          <p>1. Testa múltiplos tokens de autenticação automaticamente</p>
          <p>2. Mapeia todos os endpoints disponíveis na VPS</p>
          <p>3. Identifica a configuração que realmente funciona</p>
          <p>4. Fornece recomendações para correção permanente</p>
        </div>
      </CardContent>
    </Card>
  );
};
