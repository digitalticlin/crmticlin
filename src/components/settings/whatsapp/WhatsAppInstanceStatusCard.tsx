
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User,
  Smartphone,
  Calendar
} from "lucide-react";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppInstanceStatusCardProps {
  instance: WhatsAppInstance;
  onConnect?: () => void;
  onDelete?: () => void;
  onRefreshQrCode?: () => void;
  isLoading?: boolean;
}

const WhatsAppInstanceStatusCard = ({
  instance,
  onConnect,
  onDelete,
  onRefreshQrCode,
  isLoading = false
}: WhatsAppInstanceStatusCardProps) => {
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return {
          color: 'bg-green-50 border-green-200',
          badgeColor: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          title: 'Conectado',
          description: 'WhatsApp ativo e funcionando'
        };
      case 'connecting':
        return {
          color: 'bg-yellow-50 border-yellow-200',
          badgeColor: 'bg-yellow-100 text-yellow-800',
          icon: <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />,
          title: 'Conectando',
          description: 'Estabelecendo conexão...'
        };
      case 'disconnected':
      case 'closed':
      default:
        return {
          color: 'bg-red-50 border-red-200',
          badgeColor: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          title: 'Desconectado',
          description: 'WhatsApp não conectado'
        };
    }
  };

  const statusConfig = getStatusConfig(instance.status);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return null;
    }
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    // Formato brasileiro: +55 (11) 99999-9999
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length >= 13) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
    }
    return phone;
  };

  return (
    <Card className={`overflow-hidden ${statusConfig.color} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-6">
        {/* Header com status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {statusConfig.icon}
            <div>
              <h3 className="font-semibold text-gray-900">{statusConfig.title}</h3>
              <p className="text-sm text-gray-600">{statusConfig.description}</p>
            </div>
          </div>
          <Badge className={statusConfig.badgeColor}>
            {instance.status === 'open' ? 'Ativo' : 
             instance.status === 'connecting' ? 'Conectando' : 'Inativo'}
          </Badge>
        </div>

        {/* Informações do perfil (apenas quando conectado) */}
        {instance.status === 'open' && (
          <div className="mb-4 p-4 bg-white/50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={instance.profile_pic_url} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {instance.profile_name || 'Perfil WhatsApp'}
                </h4>
                <div className="flex items-center gap-1 text-green-600">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">{formatPhone(instance.phone)}</span>
                </div>
              </div>
            </div>
            
            {instance.client_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Smartphone className="h-4 w-4" />
                <span>Dispositivo: {instance.client_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Informações da instância */}
        <div className="space-y-2 mb-4">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Instância:</span>
            <span className="ml-2 text-gray-600 font-mono">{instance.instanceName}</span>
          </div>
          
          {instance.status === 'open' && instance.date_connected && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Conectado em: {formatDate(instance.date_connected)}</span>
            </div>
          )}
          
          {(instance.status === 'disconnected' || instance.status === 'closed') && instance.date_disconnected && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Desconectado em: {formatDate(instance.date_disconnected)}</span>
            </div>
          )}
        </div>

        {/* Ações baseadas no status */}
        <div className="flex gap-2">
          {instance.status === 'open' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDelete}
                disabled={isLoading}
                className="flex-1"
              >
                Desconectar
              </Button>
            </>
          )}
          
          {(instance.status === 'disconnected' || instance.status === 'closed') && (
            <>
              <Button 
                onClick={onConnect}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  'Conectar'
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDelete}
                disabled={isLoading}
              >
                Remover
              </Button>
            </>
          )}
          
          {instance.status === 'connecting' && (
            <div className="flex-1 text-center py-2">
              <div className="flex items-center justify-center gap-2 text-yellow-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Aguardando conexão...</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppInstanceStatusCard;
