
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, QrCode, RefreshCw, Eye, CheckCircle, Phone, Smartphone, User } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { useQRCodeValidation } from "@/hooks/whatsapp/useQRCodeValidation";

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
  const { validateQRCode } = useQRCodeValidation();
  const qrValidation = validateQRCode(instance.qr_code);

  // Fix status mapping - recognize 'ready' and 'open' as connected
  const isConnected = instance.connection_status === 'connected' || 
                     instance.connection_status === 'ready' || 
                     instance.connection_status === 'open';
  
  const isConnecting = instance.connection_status === 'connecting';
  const isDisconnected = instance.connection_status === 'disconnected';
  const isCreating = instance.web_status === 'creating';

  const getStatusBadge = () => {
    if (isConnected) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 font-medium">
          <CheckCircle className="w-3 h-3 mr-1" />
          Conectado
        </Badge>
      );
    }
    
    if (isConnecting) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 font-medium">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse" />
          Conectando
        </Badge>
      );
    }
    
    if (isDisconnected) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300 font-medium">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
          Desconectado
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-300 font-medium">
        <div className="w-2 h-2 bg-gray-500 rounded-full mr-1 animate-pulse" />
        Preparando
      </Badge>
    );
  };

  const getQRStatus = () => {
    if (!instance.qr_code) {
      return {
        status: 'none',
        message: 'Sem QR Code',
        color: 'text-gray-500'
      };
    }

    if (qrValidation.isPlaceholder) {
      return {
        status: 'placeholder',
        message: 'Gerando QR real...',
        color: 'text-yellow-600'
      };
    }

    if (!qrValidation.isValid) {
      return {
        status: 'invalid',
        message: 'QR inválido',
        color: 'text-red-600'
      };
    }

    return {
      status: 'valid',
      message: 'QR pronto',
      color: 'text-green-600'
    };
  };

  const qrStatus = getQRStatus();

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    
    // Format Brazilian phone number
    if (phone.startsWith('55')) {
      const number = phone.slice(2);
      if (number.length === 11) {
        return `+55 ${number.slice(0, 2)} ${number.slice(2, 7)}-${number.slice(7)}`;
      }
    }
    
    return `+${phone}`;
  };

  const getProfileInitials = () => {
    if (instance.profile_name) {
      return instance.profile_name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    
    if (instance.phone) {
      return instance.phone.slice(-2);
    }
    
    return 'WA';
  };

  const getActionButton = () => {
    if (isConnected) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          disabled
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Ativo
        </Button>
      );
    }

    if (isCreating) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="bg-blue-50 border-blue-200 text-blue-700"
          disabled
        >
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-1" />
          Preparando...
        </Button>
      );
    }

    if (qrStatus.status === 'valid') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={onShowQR}
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver QR Code
        </Button>
      );
    }

    if (qrStatus.status === 'placeholder') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRefreshQR(instance.id)}
          className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Aguardar QR
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRefreshQR(instance.id)}
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
      >
        <QrCode className="h-4 w-4 mr-1" />
        Gerar QR Code
      </Button>
    );
  };

  const getInstanceDisplayName = () => {
    const name = instance.instance_name;
    if (name.match(/^[a-zA-Z0-9]+\d+$/)) {
      return name;
    }
    return name;
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg bg-white/10 backdrop-blur-xl border border-white/30 ${
      isConnected ? 'border-green-300 bg-green-50/20' : ''
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-12 w-12 border-2 border-white/30">
              {instance.profile_pic_url ? (
                <AvatarImage src={instance.profile_pic_url} alt={instance.profile_name || 'Profile'} />
              ) : null}
              <AvatarFallback className="bg-[#D3D800]/20 text-[#D3D800] font-semibold">
                {getProfileInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-semibold text-gray-800 truncate">
                  {instance.profile_name || getInstanceDisplayName()}
                </CardTitle>
                {getStatusBadge()}
              </div>
              
              {instance.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  {formatPhone(instance.phone)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-white/20 rounded-xl">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Smartphone className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Dispositivo</span>
            </div>
            <p className="text-sm text-gray-800 font-medium">
              {isConnected ? 'Conectado' : isConnecting ? 'Conectando' : 'Desconectado'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <QrCode className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">QR Code</span>
            </div>
            <p className={`text-sm font-medium ${qrStatus.color}`}>
              {qrStatus.message}
            </p>
          </div>
        </div>

        {/* Connection Success Message */}
        {isConnected && (
          <div className="p-3 bg-green-100 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">WhatsApp conectado com sucesso!</span>
            </div>
          </div>
        )}

        {/* New Instance Message */}
        {isNewInstance && !isConnected && (
          <div className="p-3 bg-blue-100 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">Nova instância criada!</span>
            </div>
            <p className="text-sm text-blue-700">
              {qrStatus.status === 'valid' 
                ? '✨ QR Code disponível para escaneamento.' 
                : qrStatus.status === 'placeholder'
                ? '⏳ Aguardando QR Code...'
                : '🔧 Preparando instância...'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {getActionButton()}
          
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
  );
}
