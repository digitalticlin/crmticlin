
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, RotateCcw, Eye, Play, Square } from "lucide-react";

export const ServersCard = () => {
  const servers = [
    {
      name: "API Server",
      id: "vps-api-server",
      status: "online",
      port: 80,
      uptime: "2h 15m",
      memory: "53.7mb",
      restarts: 0,
      description: "Servidor principal da API REST"
    },
    {
      name: "WhatsApp Server", 
      id: "whatsapp-server",
      status: "online",
      port: 3001,
      uptime: "2h 12m",
      memory: "53.5mb",
      restarts: 0,
      description: "Servidor WhatsApp Web.js"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600 hover:bg-green-700">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'restarting':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Reiniciando</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-600" />
          <CardTitle>Servidores PM2</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {servers.map((server) => (
            <div key={server.id} className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {server.name}
                    {getStatusBadge(server.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {server.description}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Porta:</div>
                  <div className="font-medium">{server.port}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Uptime:</div>
                  <div className="font-medium">{server.uptime}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Memória:</div>
                  <div className="font-medium">{server.memory}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Reinícios:</div>
                  <div className="font-medium">{server.restarts}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reiniciar
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3 mr-1" />
                  Logs
                </Button>
                <Button variant="outline" size="sm">
                  <Square className="h-3 w-3 mr-1" />
                  Parar
                </Button>
              </div>
            </div>
          ))}
          
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Gerenciamento via PM2:</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  ✅ Auto-restart ativo
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
