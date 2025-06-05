
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStabilizedInstanceSync } from '@/hooks/whatsapp/useStabilizedInstanceSync';
import { useInstanceMonitor } from '@/hooks/whatsapp/useInstanceMonitor';
import { useCompanyData } from '@/hooks/useCompanyData';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Shield,
  Zap,
  Heart,
  TrendingUp
} from 'lucide-react';

/**
 * FASE 5: Dashboard de saúde das conexões
 * Métricas de estabilidade por empresa
 */
export const InstanceStabilityDashboard = () => {
  const { companyId } = useCompanyData();
  const {
    instances,
    isLoading,
    error,
    lastSync,
    syncCount,
    orphanCount,
    healthScore,
    refetch,
    forceOrphanHealing,
    isHealthy
  } = useStabilizedInstanceSync();

  const {
    stats,
    alerts,
    forceCheck,
    clearAlerts,
    isCritical
  } = useInstanceMonitor(companyId);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Saudável</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estabilidade WhatsApp</h2>
          <p className="text-muted-foreground">
            Sistema de monitoramento e healing automático
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={forceCheck} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Verificar Agora
          </Button>
          <Button onClick={forceOrphanHealing} variant="outline" size="sm">
            <Shield className="h-4 w-4 mr-1" />
            Curar Órfãs
          </Button>
        </div>
      </div>

      {/* Alertas Críticos */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas Ativos ({alerts.length})
              </CardTitle>
              <Button onClick={clearAlerts} variant="ghost" size="sm">
                Limpar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2 text-red-700">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  {alert}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score de Saúde</p>
                <p className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
                  {healthScore}%
                </p>
              </div>
              <Heart className={`h-8 w-8 ${getHealthColor(healthScore)}`} />
            </div>
            <div className="mt-2">
              {getHealthBadge(healthScore)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Instâncias Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.connectedInstances}/{stats.totalInstances}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Instâncias Órfãs</p>
                <p className={`text-2xl font-bold ${orphanCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {orphanCount}
                </p>
              </div>
              <Shield className={`h-8 w-8 ${orphanCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VPS Status</p>
                <p className={`text-2xl font-bold ${stats.vpsStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.vpsStatus === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
              <Activity className={`h-8 w-8 ${stats.vpsStatus === 'online' ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas de Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de Syncs:</span>
                <span className="font-medium">{syncCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último Sync:</span>
                <span className="font-medium">
                  {lastSync ? lastSync.toLocaleTimeString() : 'Nunca'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">
                  {isLoading ? 'Sincronizando...' : 'Idle'}
                </span>
              </div>
              {error && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Último Erro:</span>
                  <span className="font-medium text-red-600 text-sm">{error}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recursos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Sync Otimizado (1s debounce)</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Heartbeat (30s)</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Anti-Órfão</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Monitor Contínuo (15s)</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Retry Automático</span>
                <Badge variant="outline" className="bg-green-50 text-green-700">Ativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Instâncias */}
      <Card>
        <CardHeader>
          <CardTitle>Instâncias Monitoradas ({instances.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma instância encontrada
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => (
                <div 
                  key={instance.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{instance.instance_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {instance.phone || 'Sem telefone'} • VPS: {instance.vps_instance_id || 'Órfã'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        ['open', 'ready'].includes(instance.connection_status) 
                          ? 'default' 
                          : 'destructive'
                      }
                    >
                      {instance.connection_status || 'Desconectada'}
                    </Badge>
                    {!instance.vps_instance_id && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        Órfã
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
