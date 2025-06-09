import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, RefreshCw } from "lucide-react";
import { WhatsAppWebInstance } from "@/types/whatsapp";

interface WhatsAppInstanceCardProps {
  instance: WhatsAppWebInstance;
  onDelete: () => void;
}

export function WhatsAppInstanceCard({ instance, onDelete }: WhatsAppInstanceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
      case 'waiting_scan':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {instance.instance_name}
          </div>
          <Badge className={getStatusColor(instance.connection_status)}>
            {instance.connection_status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Telefone: {instance.phone || 'Não conectado'}
          </p>
          {instance.profile_name && (
            <p className="text-sm text-muted-foreground">
              Perfil: {instance.profile_name}
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
