
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  MessageSquare,
  Building2,
  Activity
} from "lucide-react";

export const AnalyticsPanel = () => {
  const analyticsData = [
    {
      title: "Crescimento de Usuários",
      value: "+23%",
      description: "Comparado ao mês anterior",
      trend: "up",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Mensagens Enviadas",
      value: "12.4K",
      description: "Últimos 30 dias",
      trend: "up", 
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Taxa de Conversão",
      value: "68%",
      description: "Leads para clientes",
      trend: "up",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Uptime Médio",
      value: "99.8%",
      description: "Disponibilidade do sistema",
      trend: "stable",
      icon: Activity,
      color: "text-orange-600", 
      bgColor: "bg-orange-50"
    }
  ];

  const reports = [
    {
      name: "Relatório de Usuários",
      description: "Atividade e engagement dos usuários",
      lastGenerated: "2 horas atrás",
      size: "2.3 MB"
    },
    {
      name: "Relatório de Instâncias",
      description: "Performance das conexões WhatsApp", 
      lastGenerated: "1 dia atrás",
      size: "1.8 MB"
    },
    {
      name: "Relatório Financeiro",
      description: "Receita e assinaturas por período",
      lastGenerated: "3 dias atrás", 
      size: "956 KB"
    },
    {
      name: "Relatório de Sistema",
      description: "Logs de erro e performance",
      lastGenerated: "1 semana atrás",
      size: "4.1 MB"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Relatórios</h1>
          <p className="text-gray-600 mt-1">
            Métricas de performance e relatórios detalhados da plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Período Customizado
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Exportar Dados
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsData.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg ${metric.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'}>
                    {metric.trend === 'up' ? '↗' : '→'}
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</h3>
                <p className="text-sm font-medium text-gray-700 mb-1">{metric.title}</p>
                <p className="text-xs text-gray-500">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Crescimento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-gray-600">Gráfico de crescimento</p>
                <p className="text-sm text-gray-500">Em desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Performance por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-600">Análise de performance</p>
                <p className="text-sm text-gray-500">Em desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-600" />
            Relatórios Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Gerado {report.lastGenerated}</span>
                    <span>•</span>
                    <span>{report.size}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Visualizar
                  </Button>
                  <Button size="sm" className="gap-1">
                    <Download className="w-3 h-3" />
                    Baixar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-blue-900 mb-1">Top Empresa</h4>
            <p className="text-sm text-blue-700">Empresa ABC - 2.3K mensagens</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-green-900 mb-1">Pico de Uso</h4>
            <p className="text-sm text-green-700">14:00 - 16:00 (horário comercial)</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-purple-900 mb-1">Engajamento</h4>
            <p className="text-sm text-purple-700">85% dos usuários ativos diariamente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
