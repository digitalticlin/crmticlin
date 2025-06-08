import { useEffect, useState } from 'react';
import { useWhatsAppRealtime } from '@/hooks/whatsapp/useWhatsAppRealtime';
import { useWhatsAppInstanceState } from '@/hooks/whatsapp/whatsappInstanceStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, MessageCircle, Users, Activity } from 'lucide-react';

interface WhatsAppStatusMonitorProps {
  userEmail: string;
}

export const WhatsAppStatusMonitor = ({ userEmail }: WhatsAppStatusMonitorProps) => {
  const { instances } = useWhatsAppInstanceState();
  const { isConnected } = useWhatsAppRealtime();
  const [stats, setStats] = useState({
    connected: 0,
    disconnected: 0,
    totalMessages: 0,
    activeChats: 0
  });

  useEffect(() => {
    const connected = instances.filter(i => i.connection_status === 'open').length;
    const disconnected = instances.filter(i => i.connection_status !== 'open').length;
    
    setStats({
      connected,
      disconnected,
      totalMessages: 0, // Seria calculado via query
      activeChats: 0    // Seria calculado via query
    });
  }, [instances]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'waiting_scan': return 'bg-blue-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'waiting_scan': return 'Aguardando QR';
      case 'disconnected': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-4">
      {/* Cards de Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conectadas</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
            <p className="text-xs text-muted-foreground">Instâncias ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desconectadas</CardTitle>
            <WifiOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.disconnected}</div>
            <p className="text-xs text-muted-foreground">Instâncias offline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chats Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeChats}</div>
            <p className="text-xs text-muted-foreground">Conversas abertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Instâncias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status das Instâncias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {instances.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma instância encontrada
              </p>
            ) : (
              instances.map((instance) => (
                <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(instance.connection_status)}`} />
                    <div>
                      <p className="font-medium">{instance.instanceName}</p>
                      {instance.phone && (
                        <p className="text-sm text-muted-foreground">+{instance.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={instance.connection_status === 'open' ? 'default' : 'secondary'}>
                      {getStatusText(instance.connection_status)}
                    </Badge>
                    {instance.updated_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(instance.updated_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
