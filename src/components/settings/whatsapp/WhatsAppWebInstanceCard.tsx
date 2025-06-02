
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, QrCode, RefreshCw, Wifi, Eye, CheckCircle, AlertCircle, Clock } from "lucide-react";
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

  const getStatusBadge = () => {
    switch (instance.connection_status) {
      case 'connected':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 font-medium">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 font-medium">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse" />
            Conectando
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 font-medium">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
            Desconectado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300 font-medium">
            <Clock className="w-3 h-3 mr-1" />
            Inicializando
          </Badge>
        );
    }
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

  const isConnected = instance.connection_status === 'connected';
  const isDisconnected = instance.connection_status === 'disconnected';
  const isCreating = instance.web_status === 'creating';
  const qrStatus = getQRStatus();

  const getActionButton = () => {
    if (isConnected) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          disabled
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Conectado
        </Button>
      );
    }

    if (isCreating) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="flex-1 bg-blue-50 border-blue-200 text-blue-700"
          disabled
        >
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-1" />
          Criando...
        </Button>
      );
    }

    if (qrStatus.status === 'valid') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={onShowQR}
          className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
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
          className="flex-1 bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Aguardar QR Real
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRefreshQR(instance.id)}
        className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
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
    <Card className={`transition-all duration-200 hover:shadow-md border-2 ${
      isNewInstance ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Wifi className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {getInstanceDisplayName()}
              </CardTitle>
              {instance.phone && (
                <p className="text-sm text-gray-600 font-medium mt-1">
                  📱 {instance.phone}
                </p>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        {instance.profile_name && (
          <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-800 font-medium truncate">
              👤 {instance.profile_name}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-600">Status:</span>
              <p className="text-gray-800 mt-1">{instance.web_status || 'Criando...'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">QR Code:</span>
              <p className={`mt-1 font-medium ${qrStatus.color}`}>
                {qrStatus.message}
              </p>
            </div>
          </div>
          {instance.vps_instance_id && (
            <div className="pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-600 text-xs">VPS ID:</span>
              <p className="text-xs text-gray-800 font-mono mt-1 break-all">
                {instance.vps_instance_id}
              </p>
            </div>
          )}
        </div>

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

        {isNewInstance && (
          <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-blue-800">Nova instância criada!</span>
            </div>
            <p className="text-xs text-blue-700">
              {qrStatus.status === 'valid' 
                ? '✨ QR Code disponível para escaneamento.' 
                : qrStatus.status === 'placeholder'
                ? '⏳ Aguardando QR Code real do WhatsApp...'
                : '🔧 Configurando instância...'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
