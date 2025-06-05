
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  Database, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCcw,
  TrendingUp,
  Clock
} from "lucide-react";

interface SystemStats {
  totalInstances: number;
  connectedInstances: number;
  orphanInstances: number;
  totalCompanies: number;
  recentSyncs: number;
  lastSyncTime: string | null;
  healthScore: number;
}

export const SystemHealthDashboard = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalInstances: 0,
    connectedInstances: 0,
    orphanInstances: 0,
    totalCompanies: 0,
    recentSyncs: 0,
    lastSyncTime: null,
    healthScore: 100
  });
  const [loading, setLoading] = useState(true);

  const fetchSystemStats = async () => {
    try {
      // Buscar estatísticas das instâncias
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('connection_status, company_id, vps_instance_id, updated_at');

      // Buscar total de empresas
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('active', true);

      // Buscar logs recentes de sync
      const { data: recentLogs } = await supabase
        .from('auto_sync_logs')
        .select('*')
        .gte('execution_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('execution_time', { ascending: false });

      if (instances) {
        const connected = instances.filter(i => 
          ['ready', 'open'].includes(i.connection_status)
        ).length;
        
        const orphans = instances.filter(i => !i.company_id).length;
        
        const healthScore = instances.length > 0 
          ? Math.round((connected / instances.length) * 100)
          : 100;

        const lastSync = recentLogs?.[0]?.execution_time || null;

        setStats({
          totalInstances: instances.length,
          connectedInstances: connected,
          orphanInstances: orphans,
          totalCompanies: companies?.length || 0,
          recentSyncs: recentLogs?.length || 0,
          lastSyncTime: lastSync,
          healthScore
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemStats();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchSystemStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard de Saúde do Sistema</h2>
        <Button 
          onClick={fetchSystemStats}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Instâncias</p>
                <p className="text-2xl font-bold">{stats.totalInstances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Conectadas</p>
                <p className="text-2xl font-bold">{stats.connectedInstances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Órfãs</p>
                <p className="text-2xl font-bold">{stats.orphanInstances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Empresas</p>
                <p className="text-2xl font-bold">{stats.totalCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status geral */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Saúde do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Score de Saúde</span>
              <Badge className={getHealthBadge(stats.healthScore)}>
                {stats.healthScore}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  stats.healthScore >= 80 ? 'bg-green-500' :
                  stats.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.healthScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Baseado na proporção de instâncias conectadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Syncs (24h)</span>
                <span className="font-medium">{stats.recentSyncs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Último Sync</span>
                <span className="font-medium">
                  {stats.lastSyncTime 
                    ? new Date(stats.lastSyncTime).toLocaleString('pt-BR')
                    : 'Nunca'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={stats.recentSyncs > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {stats.recentSyncs > 0 ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
