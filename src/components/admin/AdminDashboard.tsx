
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Activity, 
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { useInstancesData } from "@/hooks/whatsapp/useInstancesData";
import { useStabilizedInstanceSync } from "@/hooks/whatsapp/useStabilizedInstanceSync";

export const AdminDashboard = () => {
  const { instances, isLoading } = useInstancesData();
  const { healthScore, isHealthy, syncCount } = useStabilizedInstanceSync();

  const connectedInstances = instances.filter(i => 
    ['open', 'ready', 'connected'].includes(i.connection_status)
  );

  const kpiData = [
    {
      title: "Instâncias Ativas",
      value: connectedInstances.length,
      total: instances.length,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "+12%",
      trendColor: "text-green-600"
    },
    {
      title: "Empresas Cadastradas",
      value: "47",
      icon: Building2,
      color: "text-blue-600", 
      bgColor: "bg-blue-50",
      trend: "+3%",
      trendColor: "text-blue-600"
    },
    {
      title: "Usuários Ativos",
      value: "156",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50", 
      trend: "+8%",
      trendColor: "text-purple-600"
    },
    {
      title: "Saúde do Sistema",
      value: `${healthScore}%`,
      icon: Activity,
      color: isHealthy ? "text-green-600" : "text-yellow-600",
      bgColor: isHealthy ? "bg-green-50" : "bg-yellow-50",
      trend: isHealthy ? "Excelente" : "Atenção",
      trendColor: isHealthy ? "text-green-600" : "text-yellow-600"
    }
  ];

  const quickActions = [
    {
      title: "Sincronizar Instâncias",
      description: "Atualizar status de todas as conexões",
      icon: RefreshCw,
      action: "sync",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Verificar Órfãs", 
      description: "Buscar instâncias não vinculadas",
      icon: AlertTriangle,
      action: "orphans",
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      title: "Relatórios",
      description: "Gerar relatório de uso",
      icon: BarChart3, 
      action: "reports",
      color: "bg-green-500 hover:bg-green-600"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-2">
            Visão geral da plataforma Ticlin • Atualizado há poucos minutos
          </p>
        </div>
        <Button className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar Dados
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl ${kpi.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                  <Badge variant="secondary" className={kpi.trendColor}>
                    {kpi.trend}
                  </Badge>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {kpi.value}
                    {kpi.total && <span className="text-gray-400">/{kpi.total}</span>}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">{kpi.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button 
                  key={action.action}
                  variant="outline" 
                  className={`h-auto p-6 flex flex-col items-center gap-3 hover:scale-105 transition-transform ${action.color.includes('blue') ? 'border-blue-200 hover:border-blue-300' : action.color.includes('orange') ? 'border-orange-200 hover:border-orange-300' : 'border-green-200 hover:border-green-300'}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900">{action.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Status dos Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Servidor VPS", status: "online", response: "12ms" },
              { name: "Base de Dados", status: "online", response: "8ms" },
              { name: "WhatsApp Web.js", status: "online", response: "45ms" },
              { name: "Webhooks", status: "online", response: "23ms" }
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${service.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{service.response}</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { event: "Nova instância criada", time: "2 min atrás", type: "success" },
              { event: "Sincronização completada", time: "5 min atrás", type: "info" },
              { event: "Usuário conectado", time: "12 min atrás", type: "success" },
              { event: "Backup realizado", time: "1 hora atrás", type: "info" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-2">
                <div className={`w-2 h-2 rounded-full ${activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.event}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
