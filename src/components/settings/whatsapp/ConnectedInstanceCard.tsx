
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, User, Trash2, CheckCircle, Wifi } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface ConnectedInstanceCardProps {
  instance: WhatsAppWebInstance;
  onDelete: (instanceId: string) => Promise<void>;
}

export function ConnectedInstanceCard({ instance, onDelete }: ConnectedInstanceCardProps) {
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja desconectar este WhatsApp?')) return;
    await onDelete(instance.id);
  };

  const isConnected = instance.web_status === 'ready' || instance.web_status === 'open';

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {instance.profile_pic_url ? (
              <img 
                src={instance.profile_pic_url} 
                alt="Foto do perfil"
                className="w-12 h-12 rounded-full border-2 border-green-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">WhatsApp Conectado</span>
              </div>
              {instance.profile_name && (
                <p className="text-sm text-green-700 font-medium">
                  {instance.profile_name}
                </p>
              )}
            </div>
          </div>
          
          {isConnected && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Online
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {instance.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">{instance.phone}</span>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Desconectar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
