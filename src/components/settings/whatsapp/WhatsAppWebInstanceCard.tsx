
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { WhatsAppWebInstance } from "@/types/whatsapp";
import { InstanceProfileSection } from "./InstanceProfileSection";
import { InstanceActionButton } from "./InstanceActionButton";
import { InstanceStatusMessages } from "./InstanceStatusMessages";

interface WhatsAppWebInstanceCardProps {
  instance: WhatsAppWebInstance;
  onDelete: (instanceId: string) => void;
  onRefreshQR: (instanceId: string) => void;
  onShowQR: () => void;
  isNewInstance?: boolean;
}

export function WhatsAppWebInstanceCard({
  instance,
  onDelete,
  onRefreshQR,
  onShowQR,
  isNewInstance = false
}: WhatsAppWebInstanceCardProps) {
  const isConnected = instance.connection_status === 'connected' || 
                     instance.connection_status === 'ready' || 
                     instance.connection_status === 'open';

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg bg-white/30 backdrop-blur-xl border border-white/30 rounded-3xl ${
      isConnected ? 'border-green-300 bg-green-50/20' : ''
    }`}>
      <CardHeader className="pb-3">
        <InstanceProfileSection instance={instance} />
      </CardHeader>

      <CardContent className="space-y-3">
        <InstanceStatusMessages
          connectionStatus={instance.connection_status}
          qrCode={instance.qr_code}
          isNewInstance={isNewInstance}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <InstanceActionButton
            connectionStatus={instance.connection_status}
            webStatus={instance.web_status}
            qrCode={instance.qr_code}
            instanceId={instance.id}
            onRefreshQR={onRefreshQR}
            onShowQR={onShowQR}
          />
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar a instância <strong>{instance.instance_name}</strong>? 
                  Esta ação não pode ser desfeita e removerá permanentemente:
                  <br />
                  • Conexão WhatsApp
                  • Histórico de conversas
                  • Configurações da instância
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(instance.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sim, deletar instância
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
