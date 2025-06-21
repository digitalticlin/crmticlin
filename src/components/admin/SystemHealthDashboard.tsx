
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Database, 
  Users, 
  MessageSquare, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemStats {
  totalUsers: number;
  activeInstances: number;
  totalMessages: number;
  recentActivity: number;
  orphanedInstances: number;
  healthScore: number;
}

export const SystemHealthDashboard = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchSystemStats();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchSystemStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStats = async () => {
    try {
      setIsLoading(true);
      
      // Buscar estatísticas de usuários
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id');
      
      if (usersError) throw usersError;

      // Buscar estatísticas de instâncias
      const { data: instances, error: instancesError } = await supabase
        .from('whatsapp_instances')
        .select('connection_status, created_by_user_id, created_at');
      
      if (instancesError) throw instancesError;

      // Buscar estatísticas de mensagens
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      if (messagesError) throw messagesError;

      const totalUsers = users?.length || 0;
      const totalInstances = instances?.length || 0;
      const activeInstances = instances?.filter(i => 
        i.connection_status === 'connected' || i.connection_status === 'ready'
      ).length || 0;
      
      const orphanedInstances = instances?.filter(i => !i.created_by_user_id).length || 0;
      const totalMessages = messages?.length || 0;
      
      // Calcular atividade recente (últimas 24h)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentActivity = instances?.filter(i => {
        const createdAt = new Date(i.created_at);
        return createdAt > dayAgo;
      }).length || 0;

      // Calcular score de saúde (0-100)
      let healthScore = 100;
      if (totalInstances > 0) {
        const activeRatio = activeInstances / totalInstances;
        const orphanRatio = orphanedInstances / totalInstances;
        
        healthScore = Math.round(
          (activeRatio * 70) + // 70% baseado em instâncias ativas
          ((1 - orphanRatio) * 20) + // 20% baseado em instâncias não órfãs
          (totalMessages > 0 ? 10 : 0) // 10% se há atividade de mensagens
        );
      }

      setStats({
        totalUsers,
        activeInstances,
        totalMessages,
        recentActivity,
        orphanedInstances,
        healthScore
      });
      
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas do sistema:', error);
      toast.error('Erro ao carregar estatísticas do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Excelente</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Bom</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Crítico</Badge>;
    }
  };

  if (isLoading && !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Saúde do Sistema
            </div>
            <div className="flex items-center gap-2">
              {stats && getHealthBadge(stats.healthScore)}
              <Button onClick={fetchSystemStats} size="sm" variant="outline" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardTitle>
          {lastUpdate && (
            <p className="text-sm text-gray-600">
              Última atualização: {lastUpdate.toLocaleString('pt-BR')}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="text-sm text-blue-800">Usuários Total</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <MessageSquare className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{stats.activeInstances}</div>
                <div className="text-sm text-green-800">Instâncias Ativas</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">{stats.totalMessages}</div>
                <div className="text-sm text-purple-800">Mensagens (24h)</div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-orange-600">{stats.recentActivity}</div>
                <div className="text-sm text-orange-800">Atividade Recente</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && stats.orphanedInstances > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                Atenção: {stats.orphanedInstances} instância(s) órfã(s) detectada(s)
              </span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Recomendamos vincular essas instâncias aos proprietários corretos
            </p>
          </CardContent>
        </Card>
      )}

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Métricas Detalhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Score de Saúde:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stats.healthScore >= 80 ? 'bg-green-500' : 
                        stats.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${stats.healthScore}%` }}
                    ></div>
                  </div>
                  <span className="font-medium">{stats.healthScore}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Taxa de Instâncias Ativas:</span>
                  <p className="text-gray-600">
                    {stats.activeInstances > 0 
                      ? `${Math.round((stats.activeInstances / (stats.activeInstances + stats.orphanedInstances)) * 100)}%`
                      : '0%'
                    }
                  </p>
                </div>
                <div>
                  <span className="font-medium">Instâncias Órfãs:</span>
                  <p className={stats.orphanedInstances > 0 ? "text-orange-600" : "text-green-600"}>
                    {stats.orphanedInstances} instância(s)
                  </p>
                </div>
                <div>
                  <span className="font-medium">Atividade Recente:</span>
                  <p className="text-gray-600">
                    {stats.recentActivity} nova(s) instância(s) em 24h
                  </p>
                </div>
                <div>
                  <span className="font-medium">Volume de Mensagens:</span>
                  <p className="text-gray-600">
                    {stats.totalMessages} mensagem(s) em 24h
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
