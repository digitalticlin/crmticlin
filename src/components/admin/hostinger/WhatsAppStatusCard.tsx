
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Clock, Smartphone, WifiOff, CheckCircle2 } from "lucide-react";

interface WhatsAppStatusCardProps {
  whatsappStatus: any;
  isServerOnline: boolean;
}

export const WhatsAppStatusCard = ({ whatsappStatus, isServerOnline }: WhatsAppStatusCardProps) => {
  // Simular dados para exemplo visual
  const mockData = {
    isConnected: isServerOnline && Math.random() > 0.5,
    activeInstances: isServerOnline ? Math.floor(Math.random() * 3) + 1 : 0,
    messagesLast24h: isServerOnline ? Math.floor(Math.random() * 50) + 10 : 0,
    lastActivity: isServerOnline ? "Há 2 minutos" : "Desconectado"
  };

  const StatusIcon = mockData.isConnected ? CheckCircle2 : WifiOff;
  const statusColor = mockData.isConnected ? 'text-green-600' : 'text-gray-500';
  const statusBg = mockData.isConnected ? 'bg-green-50' : 'bg-gray-50';
  const statusText = mockData.isConnected ? 'WhatsApp Conectado' : 'WhatsApp Desconectado';

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-900">WhatsApp Web</CardTitle>
          <Badge variant="outline" className={`${statusBg} ${statusColor} border-current`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isServerOnline ? (
          <div className="text-center py-6">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">Servidor Offline</h3>
            <p className="text-gray-500">Ligue o servidor para ver o status do WhatsApp</p>
          </div>
        ) : (
          <>
            {/* Status Visual */}
            <div className={`p-4 rounded-lg ${statusBg}`}>
              <div className="flex items-center gap-3">
                <MessageCircle className={`h-6 w-6 ${statusColor}`} />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {mockData.isConnected ? 'Recebendo mensagens normalmente' : 'Aguardando conexão'}
                  </h4>
                  <p className="text-sm text-gray-600">Última atividade: {mockData.lastActivity}</p>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-700">{mockData.activeInstances}</div>
                <div className="text-xs text-blue-600">WhatsApp Ativos</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <MessageCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-700">{mockData.messagesLast24h}</div>
                <div className="text-xs text-green-600">Mensagens 24h</div>
              </div>
            </div>

            {/* Explicação */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">💡 Como funciona:</p>
                  <p>Cada WhatsApp conectado pode receber e enviar mensagens automaticamente para seus clientes.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
