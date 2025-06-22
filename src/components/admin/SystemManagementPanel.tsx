
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings2, 
  FileText, 
  Database, 
  Server, 
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Trash2
} from "lucide-react";
import { SyncLogsPanel } from "@/components/admin/SyncLogsPanel";

export const SystemManagementPanel = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const systemHealth = [
    {
      component: "Base de Dados",
      status: "online",
      uptime: "99.9%",
      lastCheck: "30s atrás",
      icon: Database
    },
    {
      component: "Servidor VPS", 
      status: "online",
      uptime: "99.8%", 
      lastCheck: "45s atrás",
      icon: Server
    },
    {
      component: "Sistema de Logs",
      status: "online",
      uptime: "100%",
      lastCheck: "15s atrás", 
      icon: FileText
    },
    {
      component: "Sincronização",
      status: "warning",
      uptime: "98.5%",
      lastCheck: "2m atrás",
      icon: RefreshCw
    }
  ];

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    // Simular refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Sistema</h1>
          <p className="text-gray-600 mt-1">
            Monitoramento, logs e configurações da plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar Logs
          </Button>
          <Button 
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar Status
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Status dos Componentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemHealth.map((component) => {
              const Icon = component.icon;
              const isOnline = component.status === 'online';
              const isWarning = component.status === 'warning';
              
              return (
                <div 
                  key={component.component}
                  className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${isOnline ? 'text-green-600' : isWarning ? 'text-yellow-600' : 'text-red-600'}`} />
                    <Badge 
                      variant={isOnline ? "default" : isWarning ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {isOnline ? 'Online' : isWarning ? 'Atenção' : 'Offline'}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">{component.component}</h4>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-medium">{component.uptime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verificado:</span>
                      <span>{component.lastCheck}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Ferramentas de Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logs" className="gap-2">
                <FileText className="w-4 h-4" />
                Logs Gerais
              </TabsTrigger>
              <TabsTrigger value="sync-logs" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Logs Sync
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <Settings2 className="w-4 h-4" />
                Configurações
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="logs" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Logs do Sistema</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Visualize e analise todos os eventos e atividades da plataforma
                </p>
              </div>
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Logs Gerais</h3>
                <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
              </div>
            </TabsContent>
            
            <TabsContent value="sync-logs" className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-orange-600" />
                  <h4 className="font-medium text-orange-800">Logs de Sincronização</h4>
                </div>
                <p className="text-sm text-orange-700">
                  Monitore processos de sincronização e detecte possíveis problemas
                </p>
              </div>
              <SyncLogsPanel />
            </TabsContent>
            
            <TabsContent value="config" className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="w-4 h-4 text-green-600" />
                  <h4 className="font-medium text-green-800">Configurações do Sistema</h4>
                </div>
                <p className="text-sm text-green-700">
                  Ajuste parâmetros globais e configurações avançadas da plataforma
                </p>
              </div>
              <div className="text-center py-8">
                <Settings2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações</h3>
                <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Backup Manual</h4>
            <p className="text-sm text-gray-600">Criar backup dos dados</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <Trash2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Limpeza</h4>
            <p className="text-sm text-gray-600">Limpar logs antigos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Diagnóstico</h4>
            <p className="text-sm text-gray-600">Verificar integridade</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
