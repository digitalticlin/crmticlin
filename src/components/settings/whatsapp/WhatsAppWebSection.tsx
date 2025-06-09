
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Zap, Settings, TestTube, Rocket } from "lucide-react";
import { useWhatsAppDatabase } from "@/hooks/whatsapp/useWhatsAppDatabase";
import { WhatsAppWebInstancesGrid } from "./WhatsAppWebInstancesGrid";
import { ImprovedConnectWhatsAppButton } from "./ImprovedConnectWhatsAppButton";
import { FinalConnectionTest } from "./FinalConnectionTest";
import { CompleteServerImplementation } from "./CompleteServerImplementation";

export const WhatsAppWebSection = () => {
  const { instances, isLoading, getActiveInstance } = useWhatsAppDatabase();
  const [isConnecting, setIsConnecting] = useState(false);

  const activeInstance = getActiveInstance();
  const hasInstances = instances.length > 0;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      console.log('Iniciando conexão WhatsApp...');
      // A lógica de criação será implementada pelos componentes
    } catch (error) {
      console.error('Erro ao conectar:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefreshQR = async (instanceId: string) => {
    console.log('Refreshing QR for instance:', instanceId);
  };

  const handleDelete = async (instanceId: string) => {
    console.log('Deleting instance:', instanceId);
  };

  const handleShowQR = (instance: any) => {
    console.log('Showing QR for instance:', instance);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 animate-pulse text-green-600" />
            <span>Carregando configurações WhatsApp...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Convert instances to WhatsAppWebInstance format for the grid component
  const webInstances = instances.map(instance => ({
    id: instance.id,
    instance_name: instance.instance_name,
    connection_type: instance.connection_type || 'web',
    server_url: instance.server_url || '',
    vps_instance_id: instance.vps_instance_id || '',
    web_status: instance.web_status || '',
    connection_status: instance.connection_status,
    qr_code: instance.qr_code,
    phone: instance.phone,
    profile_name: instance.profile_name,
    profile_pic_url: instance.profile_pic_url,
    date_connected: instance.date_connected,
    date_disconnected: instance.date_disconnected,
    company_id: instance.company_id || '',
    created_by_user_id: instance.created_by_user_id || null
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-800">WhatsApp Web.js</CardTitle>
          </div>
          <p className="text-sm text-green-700">
            Gerencie suas conexões WhatsApp Web para automação de mensagens
          </p>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="implement" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="implement" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Implementar
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Gerenciar
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Nova Instância
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Teste Final
          </TabsTrigger>
        </TabsList>

        <TabsContent value="implement" className="space-y-4">
          <CompleteServerImplementation />
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          {!hasInstances ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="p-4 rounded-lg bg-green-100/50 dark:bg-green-900/30 inline-block">
                    <MessageSquare className="h-12 w-12 text-green-600 mx-auto" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Nenhuma Instância Encontrada</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Implemente o servidor completo primeiro, depois crie sua primeira instância
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <WhatsAppWebInstancesGrid 
              instances={webInstances}
              onRefreshQR={handleRefreshQR}
              onDelete={handleDelete}
              onShowQR={handleShowQR}
            />
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Criar Nova Instância</h3>
                <p className="text-muted-foreground text-sm">
                  Adicione uma nova conexão WhatsApp ao sistema
                </p>
                <ImprovedConnectWhatsAppButton 
                  onConnect={handleConnect}
                  isConnecting={isConnecting}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <FinalConnectionTest />
        </TabsContent>
      </Tabs>
    </div>
  );
};
