
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Users, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Server,
  Zap,
  TestTube
} from "lucide-react";
import { useInstancesData } from "@/hooks/whatsapp/useInstancesData";
import { useStabilizedInstanceSync } from "@/hooks/whatsapp/useStabilizedInstanceSync";
import { VPSInstanceCreationTester } from "@/components/admin/vps/VPSInstanceCreationTester";
import { toast } from "sonner";

export const ModernWhatsAppPanel = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { instances, loading, refetch } = useInstancesData();
  const { 
    syncCount, 
    healthScore, 
    isHealthy, 
    lastSync,
    refetch: forceSync 
  } = useStabilizedInstanceSync();

  const connectedInstances = instances.filter(i => 
    ['open', 'ready', 'connected'].includes(i.connection_status)
  );
  
  const disconnectedInstances = instances.filter(i => 
    !['open', 'ready', 'connected'].includes(i.connection_status)
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), forceSync()]);
      toast.success("Dados atualizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  WhatsApp Web Manager
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Sistema centralizado para gerenciar todas as conexões WhatsApp
                </p>
              </div>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {connectedInstances.length}
                </p>
                <p className="text-sm text-gray-600">Conectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <WifiOff className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {disconnectedInstances.length}
                </p>
                <p className="text-sm text-gray-600">Desconectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {instances.length}
                </p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isHealthy ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {isHealthy ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div>
                <p className={`text-2xl font-bold ${isHealthy ? 'text-green-600' : 'text-yellow-600'}`}>
                  {healthScore}%
                </p>
                <p className="text-sm text-gray-600">Saúde</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teste de Criação de Instância */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-purple-600" />
            Diagnóstico de Criação de Instâncias
          </CardTitle>
          <p className="text-sm text-gray-600">
            Use este teste para identificar em qual etapa está ocorrendo o erro de criação de instâncias WhatsApp
          </p>
        </CardHeader>
        <CardContent>
          <VPSInstanceCreationTester />
        </CardContent>
      </Card>

      {/* Status do sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado Geral:</span>
                <Badge variant={isHealthy ? "default" : "secondary"}>
                  {isHealthy ? "Saudável" : "Atenção Necessária"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sincronizações:</span>
                <span className="text-sm text-gray-600">{syncCount} realizadas</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Última Verificação:</span>
                <span className="text-sm text-gray-600">
                  {lastSync ? new Date(lastSync).toLocaleString() : 'Nunca'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Resumo Rápido</h4>
              <p className="text-sm text-gray-600">
                Sistema operando normalmente com {connectedInstances.length} instâncias ativas. 
                {disconnectedInstances.length > 0 && ` ${disconnectedInstances.length} instâncias precisam de atenção.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de instâncias */}
      <Card>
        <CardHeader>
          <CardTitle>Instâncias WhatsApp</CardTitle>
          <p className="text-sm text-gray-600">
            Visualize e gerencie todas as conexões WhatsApp do sistema
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Carregando instâncias...</p>
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Nenhuma instância encontrada
              </h3>
              <p className="text-gray-600">
                As instâncias WhatsApp aparecerão aqui quando forem criadas pelos usuários.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => (
                <div 
                  key={instance.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      ['open', 'ready', 'connected'].includes(instance.connection_status)
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`} />
                    
                    <div>
                      <p className="font-medium">{instance.instance_name}</p>
                      <p className="text-sm text-gray-600">
                        {instance.phone || 'Telefone não configurado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={
                        ['open', 'ready', 'connected'].includes(instance.connection_status)
                          ? "default" 
                          : "secondary"
                      }
                    >
                      {instance.connection_status === 'open' ? 'Conectado' :
                       instance.connection_status === 'connecting' ? 'Conectando' :
                       instance.connection_status === 'qr_ready' ? 'Aguardando QR' :
                       'Desconectado'}
                    </Badge>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {instance.date_connected 
                        ? `Conectado em ${new Date(instance.date_connected).toLocaleDateString()}`
                        : 'Nunca conectado'
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Ações Administrativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start gap-2">
              <RefreshCw className="h-4 w-4" />
              Sincronizar Todas
            </Button>
            
            <Button variant="outline" className="justify-start gap-2">
              <Settings className="h-4 w-4" />
              Configurações VPS
            </Button>
            
            <Button variant="outline" className="justify-start gap-2">
              <Server className="h-4 w-4" />
              Status do Servidor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
