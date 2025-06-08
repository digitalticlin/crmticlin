
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { VPSEndpointDiscovery } from "@/services/whatsapp/vpsEndpointDiscovery";
import { toast } from "sonner";

interface DiscoveryResult {
  success: boolean;
  workingEndpoints?: {
    qrCode?: string;
    sendMessage?: string;
    deleteInstance?: string;
    status?: string;
  };
  fullReport?: any;
  error?: string;
}

export const VPSEndpointDiscoveryPanel = () => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  const handleDiscoverEndpoints = async () => {
    setIsDiscovering(true);
    try {
      console.log('[VPS Discovery Panel] 🔍 Iniciando descoberta...');
      
      const result = await VPSEndpointDiscovery.discoverWorkingEndpoints();
      setDiscoveryResult(result);
      
      if (result.success) {
        const endpointCount = Object.keys(result.workingEndpoints || {}).length;
        toast.success(`🎉 Descoberta concluída! ${endpointCount} endpoints funcionais encontrados`, { 
          duration: 8000 
        });
      } else {
        toast.error(`❌ Descoberta falhou: ${result.error}`);
      }

    } catch (error: any) {
      console.error('[VPS Discovery Panel] ❌ Erro:', error);
      toast.error(`Erro na descoberta: ${error.message}`);
      setDiscoveryResult({ success: false, error: error.message });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleCleanupInstances = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso deletará TODAS as instâncias da VPS. Confirma?')) {
      return;
    }

    setIsCleaning(true);
    try {
      console.log('[VPS Discovery Panel] 🧹 Iniciando limpeza...');
      
      const result = await VPSEndpointDiscovery.cleanupAllInstances();
      setCleanupResult(result);
      
      if (result.success) {
        toast.success(`🧹 Limpeza concluída! ${result.deletedCount || 0} instâncias deletadas`, { 
          duration: 8000 
        });
      } else {
        toast.error(`❌ Limpeza falhou: ${result.error}`);
      }

    } catch (error: any) {
      console.error('[VPS Discovery Panel] ❌ Erro:', error);
      toast.error(`Erro na limpeza: ${error.message}`);
      setCleanupResult({ success: false, error: error.message });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Search className="h-5 w-5" />
            Descoberta de Endpoints VPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-700">
            <p>🔍 <strong>Objetivo:</strong> Descobrir quais endpoints realmente funcionam na VPS</p>
            <p>🧪 <strong>Processo:</strong> Testa todos os endpoints possíveis e identifica os funcionais</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleDiscoverEndpoints}
              disabled={isDiscovering}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              {isDiscovering ? 'Descobrindo...' : 'Descobrir Endpoints'}
            </Button>

            <Button
              onClick={handleCleanupInstances}
              disabled={isCleaning}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isCleaning ? 'Limpando...' : 'Limpar Instâncias'}
            </Button>
          </div>

          {discoveryResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Resultado da Descoberta:</span>
                {discoveryResult.success ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Sucesso
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Falha
                  </Badge>
                )}
              </div>

              {discoveryResult.success && discoveryResult.workingEndpoints && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="text-sm font-medium text-green-800 mb-3">
                    ✅ Endpoints Funcionais Descobertos
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(discoveryResult.workingEndpoints).map(([type, endpoint]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-green-700 capitalize">
                          {type.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <code className="text-xs bg-green-100 px-2 py-1 rounded text-green-800">
                          {endpoint}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!discoveryResult.success && discoveryResult.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    ❌ Erro na Descoberta
                  </h4>
                  <p className="text-xs text-red-700">{discoveryResult.error}</p>
                </div>
              )}

              {discoveryResult.fullReport && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    📊 Relatório Completo
                  </h4>
                  <div className="text-xs text-blue-700">
                    <p><strong>Total de testes:</strong> {discoveryResult.fullReport.summary?.totalTests || 0}</p>
                    <p><strong>Testes funcionais:</strong> {discoveryResult.fullReport.summary?.workingTests || 0}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {cleanupResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Resultado da Limpeza:</span>
                {cleanupResult.success ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Sucesso
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Falha
                  </Badge>
                )}
              </div>

              {cleanupResult.success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    🧹 <strong>{cleanupResult.deletedCount || 0}</strong> instâncias foram deletadas com sucesso
                  </p>
                </div>
              )}

              {!cleanupResult.success && cleanupResult.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">❌ {cleanupResult.error}</p>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
            <p><strong>ℹ️ Como usar:</strong></p>
            <p>1. <strong>Descobrir Endpoints:</strong> Testa todos os métodos possíveis na VPS</p>
            <p>2. <strong>Limpar Instâncias:</strong> Remove todas as instâncias órfãs após descobrir método correto</p>
            <p>3. <strong>Resultado:</strong> Use os endpoints descobertos para atualizar a configuração</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
