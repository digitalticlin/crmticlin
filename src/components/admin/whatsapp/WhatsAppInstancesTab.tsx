
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, RefreshCw } from "lucide-react";

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  phone?: string;
  connection_status: string;
  date_connected?: string;
}

interface WhatsAppInstancesTabProps {
  instances: WhatsAppInstance[];
  isLoading: boolean;
}

export const WhatsAppInstancesTab = ({ instances, isLoading }: WhatsAppInstancesTabProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Carregando instâncias...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (instances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Instâncias WhatsApp Ativas</CardTitle>
          <p className="text-sm text-gray-600">
            Visualize e gerencie todas as conexões WhatsApp do sistema
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Nenhuma instância encontrada
            </h3>
            <p className="text-gray-600">
              As instâncias WhatsApp aparecerão aqui quando forem criadas pelos usuários.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instâncias WhatsApp Ativas</CardTitle>
        <p className="text-sm text-gray-600">
          Visualize e gerencie todas as conexões WhatsApp do sistema
        </p>
      </CardHeader>
      <CardContent>
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
                   instance.connection_status === 'waiting_scan' ? 'Aguardando QR' :
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
      </CardContent>
    </Card>
  );
};
