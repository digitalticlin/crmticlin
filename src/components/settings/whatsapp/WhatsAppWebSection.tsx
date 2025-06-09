
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Zap, Settings, TestTube } from "lucide-react";
import { useWhatsAppDatabase } from "@/hooks/whatsapp/useWhatsAppDatabase";
import { WhatsAppInstancesList } from "./WhatsAppInstancesList";
import { ConnectWhatsAppButton } from "./ConnectWhatsAppButton";
import { WhatsAppWebInstanceManager } from "./WhatsAppWebInstanceManager";
import { FinalConnectionTest } from "./FinalConnectionTest";

export const WhatsAppWebSection = () => {
  const { instances, isLoading, getActiveInstance } = useWhatsAppDatabase();
  const [isConnecting, setIsConnecting] = useState(false);

  const activeInstance = getActiveInstance();
  const hasInstances = instances.length > 0;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Lógica de conexão será implementada no componente específico
      console.log('Iniciando conexão WhatsApp...');
    } catch (error) {
      console.error('Erro ao conectar:', error);
    } finally {
      setIsConnecting(false);
    }
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
      {!hasInstances ? (
        <ConnectWhatsAppButton 
          onConnect={handleConnect}
          isConnecting={isConnecting}
        />
      ) : (
        <Tabs defaultValue="instances" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
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

          <TabsContent value="instances" className="space-y-4">
            <WhatsAppInstancesList />
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <WhatsAppWebInstanceManager />
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <FinalConnectionTest />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
