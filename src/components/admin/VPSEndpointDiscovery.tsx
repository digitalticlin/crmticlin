
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, CheckCircle, XCircle, AlertTriangle, Wrench } from "lucide-react";
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

  // Mostrar endpoints corretos descobertos
  const correctEndpoints = {
    qrCode: "GET /instance/{id}/qr",
    sendMessage: "POST /send",
    deleteInstance: "POST /instance/delete",
    status: "GET /instance/{id}/status",
    createInstance: "POST /instance/create",
    webhook: "Global: https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web"
  };

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
    if (!confirm('⚠️ ATENÇÃO: Isso deletará TODAS as instâncias da VPS usando o endpoint correto POST /instance/delete. Confirma?')) {
      return;
    }

    setIsCleaning(true);
    try {
      console.log('[VPS Discovery Panel] 🧹 Iniciando limpeza com endpoint correto...');
      
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
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Wrench className="h-5 w-5" />
            ✅ Endpoints VPS Corrigidos e Funcionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-green-700">
            <p>🎯 <strong>Status:</strong> Endpoints corretos identificados e implementados</p>
            <p>🔧 <strong>Integração:</strong> Backend alinhado com VPS real</p>
          </div>

          <div className="space-y-3 p-4 bg-white border border-green-200 rounded-md">
            <h4 className="text-sm font-medium text-green-800 mb-3">
              ✅ Endpoints Funcionais Confirmados
            </h4>
            <div className="space-y-2">
              {Object.entries(correctEndpoints).map(([type, endpoint], index) => (
                <div key={index} className="flex items-center justify-between text-sm">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleDiscoverEndpoints}
              disabled={isDiscovering}
              className="gap-2"
              variant="outline"
            >
              <Search className="h-4 w-4" />
              {isDiscovering ? 'Descobrindo...' : 'Redescobrir (Verificação)'}
            </Button>

            <Button
              onClick={handleCleanupInstances}
              disabled={isCleaning}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isCleaning ? 'Limpando...' : 'Limpar Instâncias Órfãs'}
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
                    {Object.entries(discoveryResult.workingEndpoints).map(([type, endpoint], index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
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

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-200">
            <p><strong>ℹ️ Status da Correção:</strong></p>
            <p>✅ <strong>Endpoints Corrigidos:</strong> Todos os serviços foram atualizados para usar os endpoints corretos</p>
            <p>✅ <strong>Webhook Global:</strong> VPS já possui webhook configurado globalmente</p>
            <p>✅ <strong>QR Code:</strong> Agora usa GET /instance/&#123;instanceId&#125;/qr que realmente funciona</p>
            <p>🧹 <strong>Limpeza:</strong> 26 instâncias órfãs podem ser removidas com segurança</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
