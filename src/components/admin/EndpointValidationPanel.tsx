
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Search,
  Activity,
  Network,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { EndpointValidator } from "@/services/whatsapp/endpointValidator";

interface EndpointValidationPanelProps {
  onValidationComplete?: (result: any) => void;
}

export const EndpointValidationPanel = ({ onValidationComplete }: EndpointValidationPanelProps) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  const runFullValidation = async () => {
    setIsValidating(true);
    
    try {
      console.log('[Validation Panel] 🔍 Iniciando validação completa...');
      toast.info("Iniciando validação completa dos endpoints...");

      const result = await EndpointValidator.validateAllEndpoints();
      
      setValidationResult(result);
      setLastValidation(new Date());
      
      if (onValidationComplete) {
        onValidationComplete(result);
      }

      if (result.success && result.workingEndpoints > 0) {
        toast.success(`Validação concluída! ${result.workingEndpoints}/${result.totalEndpoints} endpoints funcionando`, {
          description: result.recommendation
        });
      } else {
        toast.warning('Validação concluída com problemas detectados', {
          description: result.recommendation || 'Verifique os detalhes abaixo'
        });
      }

    } catch (error: any) {
      console.error('[Validation Panel] ❌ Erro na validação:', error);
      toast.error('Erro na validação dos endpoints', {
        description: error.message
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusIcon = (working: boolean) => {
    return working ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (working: boolean) => {
    return (
      <Badge variant={working ? "default" : "destructive"}>
        {working ? "OK" : "FALHA"}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-blue-500" />
          Validação de Endpoints VPS
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Teste todos os endpoints da VPS para diagnosticar problemas de conectividade
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Validação Completa</p>
            <p className="text-xs text-gray-500">
              {lastValidation 
                ? `Última execução: ${lastValidation.toLocaleString()}`
                : "Nunca executada"
              }
            </p>
          </div>
          
          <Button
            onClick={runFullValidation}
            disabled={isValidating}
            className="gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Validar Endpoints
              </>
            )}
          </Button>
        </div>

        {/* Resultados da Validação */}
        {validationResult && (
          <div className="space-y-4">
            <Separator />
            
            {/* Status Geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {validationResult.vpsOnline ? (
                    <div className="flex items-center justify-center gap-1">
                      <Activity className="h-6 w-6 text-green-500" />
                      ONLINE
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                      OFFLINE
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">Status VPS</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {validationResult.workingEndpoints}
                </div>
                <div className="text-xs text-gray-500">Funcionando</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {validationResult.failedEndpoints}
                </div>
                <div className="text-xs text-gray-500">Com Falha</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {validationResult.totalEndpoints}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>

            {/* Recomendação */}
            {validationResult.recommendation && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-700">Recomendação</span>
                </div>
                <p className="text-sm text-blue-600">
                  {validationResult.recommendation}
                </p>
              </div>
            )}

            {/* Detalhes dos Endpoints */}
            <div className="space-y-3">
              <h4 className="font-medium">Status dos Endpoints Principais</h4>
              
              <div className="grid gap-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(validationResult.summary.health)}
                    <span className="text-sm font-medium">Health Check</span>
                  </div>
                  {getStatusBadge(validationResult.summary.health)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(validationResult.summary.createInstance)}
                    <span className="text-sm font-medium">Criar Instância</span>
                  </div>
                  {getStatusBadge(validationResult.summary.createInstance)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(validationResult.summary.qrCode)}
                    <span className="text-sm font-medium">QR Code</span>
                  </div>
                  {getStatusBadge(validationResult.summary.qrCode)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(validationResult.summary.sendMessage)}
                    <span className="text-sm font-medium">Enviar Mensagem</span>
                  </div>
                  {getStatusBadge(validationResult.summary.sendMessage)}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(validationResult.summary.deleteInstance)}
                    <span className="text-sm font-medium">Deletar Instância</span>
                  </div>
                  {getStatusBadge(validationResult.summary.deleteInstance)}
                </div>
              </div>
            </div>

            {/* Resultados Detalhados */}
            {validationResult.results && validationResult.results.length > 0 && (
              <details className="space-y-2">
                <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
                  Ver Detalhes Técnicos ({validationResult.results.length} testes)
                </summary>
                <div className="space-y-2 ml-4">
                  {validationResult.results.map((result: any, index: number) => (
                    <div key={index} className="text-xs p-2 bg-gray-100 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">
                          {result.method} {result.endpoint}
                        </span>
                        <Badge variant={result.working ? "default" : "destructive"} className="text-xs">
                          {result.status || 'N/A'}
                        </Badge>
                      </div>
                      {result.error && (
                        <p className="text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {!validationResult && (
          <div className="text-center py-8">
            <Network className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Validação de Endpoints
            </h3>
            <p className="text-gray-600 mb-4">
              Execute a validação para verificar o status de todos os endpoints da VPS
            </p>
            <Button onClick={runFullValidation} disabled={isValidating}>
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Validando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Iniciar Validação
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
