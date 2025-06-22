
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, QrCode } from "lucide-react";

interface WhatsAppInstanceGridProps {
  instances: any[];
  onDelete: (instanceId: string) => void;
  onRefreshQR: (instanceId: string) => void;
}

export const WhatsAppInstanceGrid = ({
  instances,
  onDelete,
  onRefreshQR
}: WhatsAppInstanceGridProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-600 text-white">Conectado</Badge>;
      case 'waiting_qr':
        return <Badge className="bg-yellow-600 text-white">Aguardando QR</Badge>;
      case 'pending':
        return <Badge className="bg-blue-600 text-white">Pendente</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Desconectado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionButton = (instance: any) => {
    const isConnected = instance.connection_status === 'connected';
    
    if (isConnected) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          ✅ Conectado
        </Badge>
      );
    }

    return (
      <Button
        onClick={() => onRefreshQR(instance.id)}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <QrCode className="h-4 w-4 mr-1" />
        Gerar QR Code
      </Button>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {instances.map((instance) => (
        <Card key={instance.id} className="bg-white/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="truncate">{instance.instance_name}</span>
              {getStatusBadge(instance.connection_status)}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="text-xs text-gray-600 space-y-1">
              <div>ID: {instance.id.substring(0, 8)}...</div>
              <div>Criado: {new Date(instance.created_at).toLocaleDateString()}</div>
              {instance.phone && (
                <div>Telefone: {instance.phone}</div>
              )}
            </div>

            <div className="flex gap-2">
              {getActionButton(instance)}
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(instance.id)}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
