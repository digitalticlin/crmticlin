
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, 
  Database, 
  Activity, 
  Users, 
  Shield,
  Bug,
  Terminal
} from "lucide-react";
import { GlobalInstanceManagement } from "@/components/admin/GlobalInstanceManagement";
import { VPSDebugDashboard } from "@/components/admin/VPSDebugDashboard";

const Admin = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600">
          Gerencie e monitore todos os aspectos do sistema WhatsApp
        </p>
      </div>

      <Tabs defaultValue="vps-debug" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vps-debug" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            VPS Debug
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoramento
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: VPS Debug */}
        <TabsContent value="vps-debug" className="space-y-6">
          <VPSDebugDashboard />
        </TabsContent>

        {/* Tab 2: Gerenciamento de Instâncias */}
        <TabsContent value="instances" className="space-y-6">
          <GlobalInstanceManagement />
        </TabsContent>

        {/* Tab 3: Monitoramento */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Monitoramento do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Activity className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <h3 className="font-medium">Status VPS</h3>
                  <p className="text-sm text-gray-600">Monitoramento da VPS WhatsApp</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Database className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <h3 className="font-medium">Banco de Dados</h3>
                  <p className="text-sm text-gray-600">Sincronização e performance</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <h3 className="font-medium">Usuários Ativos</h3>
                  <p className="text-sm text-gray-600">Sessões e atividades</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Configurações do Sistema */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-500" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Configurações VPS</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>URL:</strong> http://31.97.24.222:3002</p>
                    <p><strong>Status:</strong> <span className="text-green-600">Online</span></p>
                    <p><strong>Versão:</strong> WhatsApp Server v3.0.0</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Configurações Edge Functions</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Supabase:</strong> <span className="text-green-600">Conectado</span></p>
                    <p><strong>Webhook:</strong> <span className="text-green-600">Ativo</span></p>
                    <p><strong>Sincronização:</strong> <span className="text-green-600">Automática</span></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
