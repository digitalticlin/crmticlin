
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VPSHealthService, VPSHealthResult } from "@/services/whatsapp/vps/vpsHealthService";
import { VPSServerStatusDiagnostic } from "@/components/admin/vps/VPSServerStatusDiagnostic";
import { VPSPersistentServerInstallGuide } from "@/components/admin/vps/VPSPersistentServerInstallGuide";
import { 
  Heart, 
  Wifi, 
  Shield, 
  Server, 
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const VPSPersistenceDiagnostic = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<VPSHealthResult | null>(null);

  const runDiagnostic = async () => {
    setIsLoading(true);
    try {
      console.log('[VPS Diagnostic] 🏥 Iniciando diagnóstico completo...');
      
      const result = await VPSHealthService.performHealthCheck();
      setHealthResult(result);
      
      if (result.success) {
        toast.success('Diagnóstico VPS concluído com sucesso');
      } else {
        toast.error('Problemas detectados na VPS');
      }
    } catch (error) {
      console.error('[VPS Diagnostic] ❌ Erro:', error);
      toast.error('Erro ao executar diagnóstico');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'healthy': 'default',
      'partial': 'secondary',
      'offline': 'destructive',
      'error': 'destructive',
      'unknown': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Diagnóstico VPS & Persistência Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Painel completo para diagnosticar, verificar status e instalar o servidor persistente na VPS.
          </p>
        </CardContent>
      </Card>

      {/* Tabs para organizar as funcionalidades */}
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Status Atual
          </TabsTrigger>
          <TabsTrigger value="diagnostic" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Diagnóstico Completo
          </TabsTrigger>
          <TabsTrigger value="install" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Guia de Instalação
          </TabsTrigger>
        </TabsList>

        {/* Aba: Status Atual */}
        <TabsContent value="status">
          <VPSServerStatusDiagnostic />
        </TabsContent>

        {/* Aba: Diagnóstico Completo */}
        <TabsContent value="diagnostic">
          <div className="space-y-6">
            {/* Controles de Diagnóstico */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Diagnóstico Detalhado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    onClick={runDiagnostic}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                    {isLoading ? 'Diagnosticando...' : 'Executar Diagnóstico Completo'}
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">
                  Verifica conectividade, autenticação, processo do servidor e contagem de instâncias.
                </p>
              </CardContent>
            </Card>

            {/* Resultados do Diagnóstico */}
            {healthResult && (
              <div className="space-y-4">
                {/* Status Geral */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Status Geral</span>
                      {getStatusBadge(healthResult.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        <span className="text-sm">Conectividade</span>
                        {getStatusIcon(healthResult.details.connectivity)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="text-sm">Autenticação</span>
                        {getStatusIcon(healthResult.details.authentication)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        <span className="text-sm">Processo</span>
                        {getStatusIcon(healthResult.details.serverProcess)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span className="text-sm">Instâncias</span>
                        <Badge variant="outline">
                          {healthResult.details.instanceCount}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Erros */}
                {healthResult.details.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Erros Detectados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {healthResult.details.errors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recomendações */}
                {healthResult.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Recomendações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {healthResult.recommendations.map((recommendation, index) => (
                          <Alert key={index}>
                            <AlertDescription>{recommendation}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detalhes Técnicos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes Técnicos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700">
                        {JSON.stringify(healthResult, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Aba: Guia de Instalação */}
        <TabsContent value="install">
          <VPSPersistentServerInstallGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
};
