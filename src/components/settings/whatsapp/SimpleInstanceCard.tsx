import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  QrCode,
  Loader2,
  Trash2
} from "lucide-react";
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


interface SimpleInstanceCardProps {
  instance: WhatsAppWebInstance;
  onGenerateQR: (instanceId: string, instanceName: string) => void;
  onDelete: (instanceId: string) => void;
}

export const SimpleInstanceCard = ({ 
  instance, 
  onGenerateQR, 
  onDelete
}: SimpleInstanceCardProps) => {

  const getStatusInfo = () => {
    const status = instance.connection_status?.toLowerCase() || 'unknown';
    
    switch (status) {
      case 'ready':
      case 'connected':
        return {
          color: 'bg-green-100/60 text-green-800 backdrop-blur-sm border-green-200/50',
          icon: CheckCircle,
          text: 'Conectado',
          description: 'WhatsApp conectado e funcionando'
        };
      case 'connecting':
      case 'initializing':
        return {
          color: 'bg-yellow-100/60 text-yellow-800 backdrop-blur-sm border-yellow-200/50',
          icon: Clock,
          text: 'Conectando',
          description: 'Estabelecendo conexão...'
        };
      case 'qr_generated':
      case 'waiting_scan':
      case 'qr_ready':
        return {
          color: 'bg-blue-100/60 text-blue-800 backdrop-blur-sm border-blue-200/50',
          icon: AlertTriangle,
          text: 'Aguardando QR',
          description: 'QR Code disponível para escaneamento'
        };
      default:
        return {
          color: 'bg-gray-100/60 text-gray-800 backdrop-blur-sm border-gray-200/50',
          icon: AlertTriangle,
          text: 'Desconectado',
          description: 'Precisa conectar'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isConnected = ['ready', 'connected'].includes(instance.connection_status?.toLowerCase() || '');
  
  const needsQrCode = !isConnected || 
    (instance.web_status === 'waiting_qr') || 
    ['waiting_scan', 'qr_ready', 'disconnected'].includes(
      instance.connection_status?.toLowerCase() || 'unknown'
    );

  return (
    <Card className="group relative transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1
      bg-white/20 backdrop-blur-xl border border-white/20 shadow-glass rounded-2xl overflow-hidden
      min-h-[220px] flex flex-col">
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Header: Status badge apenas */}
      <CardHeader className="pb-2 relative z-10 flex-shrink-0">
        <div className="flex justify-center">
          <Badge className={`${statusInfo.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>

      {/* Corpo Central: Profile info e telefone */}
      <CardContent className="flex-1 flex flex-col justify-center items-center text-center space-y-4 relative z-10 px-6">
        <div className="space-y-3">
          {/* Profile Pic se conectado */}
          {isConnected && instance.profile_pic_url && (
            <div className="flex justify-center">
              <img 
                src={instance.profile_pic_url} 
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Profile Name se conectado */}
          {isConnected && instance.profile_name && (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {instance.profile_name}
              </h3>
            </div>
          )}
          
          {/* Telefone se disponível */}
          {instance.phone && (
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <span className="text-sm font-medium">📱 {instance.phone}</span>
            </div>
          )}
          
          {/* Descrição do status para não conectados */}
          {!isConnected && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {statusInfo.description}
            </p>
          )}
          
          {/* Data de conexão */}
          {instance.date_connected && isConnected && (
            <p className="text-xs text-gray-500">
              Conectado em {new Date(instance.date_connected).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>

      {/* Footer: Botões de ação - padding e gap reduzidos */}
      <div className="p-3 border-t border-white/10 relative z-10 flex-shrink-0">
        <div className="flex gap-1.5 justify-center">
          {needsQrCode && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onGenerateQR(instance.id, instance.instance_name)}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <QrCode className="h-4 w-4 mr-1" />
              Gerar QR
            </Button>
          )}
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50/60 backdrop-blur-sm border-white/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja deletar esta instância WhatsApp{instance.phone ? ` (${instance.phone})` : ''}? 
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
      </div>
    </Card>
  );
};
