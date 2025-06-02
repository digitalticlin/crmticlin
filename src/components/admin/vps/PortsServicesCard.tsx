
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MessageSquare, ExternalLink, Shield } from "lucide-react";

export const PortsServicesCard = () => {
  const ports = [
    {
      port: 80,
      name: "API Server",
      status: "online",
      icon: Globe,
      description: "Servidor principal da API",
      url: "http://31.97.24.222/health"
    },
    {
      port: 3001,
      name: "WhatsApp Server",
      status: "online",
      icon: MessageSquare,
      description: "Servidor WhatsApp Web.js",
      url: "http://31.97.24.222:3001/health"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600 hover:bg-green-700">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          <CardTitle>Portas e Serviços</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ports.map((port) => {
            const IconComponent = port.icon;
            return (
              <div key={port.port} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">{port.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Porta {port.port} • {port.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(port.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(port.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
          
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Firewall:</span>
                <span className="text-green-600">Configurado</span>
              </div>
              <div className="text-xs">
                • Porta 80: HTTP (API Server)<br/>
                • Porta 3001: HTTP (WhatsApp Server)<br/>
                • Porta 22: SSH (Administração)
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
