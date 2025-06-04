
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle, Loader2, Settings } from "lucide-react";
import { useCompanyData } from "@/hooks/useCompanyData";
import { useWhatsAppDatabase } from "@/hooks/whatsapp/useWhatsAppDatabase";

export function WhatsAppTestCard() {
  const { companyId, loading: companyLoading } = useCompanyData();
  const { instances, loading: instancesLoading } = useWhatsAppDatabase(companyId, companyLoading);

  const connectedInstances = instances.filter(i => i.connection_status === 'connected');
  const disconnectedInstances = instances.filter(i => i.connection_status !== 'connected');

  const isLoading = companyLoading || instancesLoading;

  // Se não tem companyId, mostrar mensagem de configuração
  if (!companyLoading && !companyId) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <CardTitle>Teste WhatsApp</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure sua empresa primeiro
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Configure os dados da sua empresa no perfil para usar o WhatsApp
            </p>
            <Button variant="outline" className="mt-2" asChild>
              <a href="/settings">Ir para Configurações</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <CardTitle>WhatsApp Status</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Status das suas conexões WhatsApp
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status atual */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium">Status da Conexão</p>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {connectedInstances.length} conectada(s), {disconnectedInstances.length} desconectada(s)
              </p>
            )}
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : connectedInstances.length > 0 ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <div className="h-2 w-2 bg-gray-400 rounded-full" />
          )}
        </div>

        {/* Instâncias conectadas */}
        {connectedInstances.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-600">Instâncias Conectadas:</p>
            {connectedInstances.slice(0, 2).map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <div>
                  <p className="text-sm font-medium">{instance.instance_name}</p>
                  <p className="text-xs text-muted-foreground">{instance.phone || 'Sem telefone'}</p>
                </div>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            ))}
            {connectedInstances.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{connectedInstances.length - 2} outras instâncias
              </p>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="space-y-2">
          {isLoading ? (
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Carregando...
            </Button>
          ) : connectedInstances.length === 0 ? (
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              asChild
            >
              <a href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Configurar WhatsApp
              </a>
            </Button>
          ) : (
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              asChild
            >
              <a href="/whatsapp-chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Abrir Chat WhatsApp
              </a>
            </Button>
          )}

          <Button variant="outline" className="w-full" asChild>
            <a href="/settings">
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Instâncias
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
