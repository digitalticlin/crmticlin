import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, QrCode, RefreshCw, Wifi, Eye, CheckCircle } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";

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
  const getStatusBadge = () => {
    switch (instance.connection_status) {
      case 'connected':
        return (
          <Badge className="bg-green-100/80 text-green-800 border-green-200/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'connecting':
        return (
          <Badge className="bg-yellow-100/80 text-yellow-800 border-yellow-200/50 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse" />
            Conectando
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-red-100/80 text-red-800 border-red-200/50 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1" />
            Desconectado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100/80 text-gray-800 border-gray-200/50 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50">
            <div className="w-2 h-2 bg-gray-500 rounded-full mr-1" />
            Aguardando
          </Badge>
        );
    }
  };

  const isConnected = instance.connection_status === 'connected';
  const isDisconnected = instance.connection_status === 'disconnected';
  const hasQRCode = instance.qr_code && (instance.web_status === 'waiting_scan' || instance.web_status === 'created');
  const needsQRCode = (isDisconnected || instance.web_status === 'created') && !hasQRCode;
  const isCreating = instance.web_status === 'creating';

  const getActionButton = () => {
    if (isConnected) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="flex-1 glass-card border-0 bg-green-50/50 hover:bg-green-100/50 dark:bg-green-900/20 dark:hover:bg-green-800/30"
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
          className="flex-1 glass-card border-0 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-800/30"
          disabled
        >
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-1" />
          Criando...
        </Button>
      );
    }

    if (hasQRCode) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={onShowQR}
          className="flex-1 glass-card border-0 bg-blue-50/50 hover:bg-blue-100/50 dark:bg-blue-900/20 dark:hover:bg-blue-800/30"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver QR Code
        </Button>
      );
    }

    if (needsQRCode) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRefreshQR(instance.id)}
          className="flex-1 glass-card border-0 bg-green-50/50 hover:bg-green-100/50 dark:bg-green-900/20 dark:hover:bg-green-800/30"
        >
          <QrCode className="h-4 w-4 mr-1" />
          Gerar QR Code
        </Button>
      );
    }

    // For other states (connecting, etc.)
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRefreshQR(instance.id)}
        className="flex-1 glass-card border-0 bg-gray-50/50 hover:bg-gray-100/50 dark:bg-gray-900/20 dark:hover:bg-gray-800/30"
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Atualizar Status
      </Button>
    );
  };

  const getInstanceDisplayName = () => {
    // Extract username from instance name for better display
    const name = instance.instance_name;
    if (name.match(/^[a-zA-Z0-9]+\d+$/)) {
      // If it's in the new format (username + number), show as is
      return name;
    }
    // For older format names, keep as is
    return name;
  };

  return (
    <Card className={`glass-card border-0 transition-all duration-200 hover:shadow-lg ${
      isNewInstance ? 'ring-2 ring-blue-300/50 bg-blue-50/30 dark:bg-blue-900/20' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-800/30">
              <Wifi className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{getInstanceDisplayName()}</CardTitle>
              {instance.phone && (
                <p className="text-sm text-muted-foreground mt-1">
                  📱 {instance.phone}
                </p>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>
        
        {instance.profile_name && (
          <div className="flex items-center gap-2 mt-2 p-2 glass-card bg-green-50/30 dark:bg-green-900/20 rounded-lg">
            <span className="text-sm text-green-600 dark:text-green-400">
              👤 {instance.profile_name}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground space-y-1 p-3 glass-card bg-gray-50/30 dark:bg-gray-900/20 rounded-lg">
          <p>VPS ID: {instance.vps_instance_id}</p>
          <p>Status: {instance.web_status || 'Criando...'}</p>
          {hasQRCode && (
            <p className="text-green-600 dark:text-green-400">QR Code: Disponível</p>
          )}
        </div>

        <div className="flex gap-2">
          {getActionButton()}
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(instance.id)}
            className="bg-red-500/80 hover:bg-red-600/80 shadow-lg"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {isNewInstance && (
          <div className="mt-3 p-3 glass-card bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-200/30">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ✨ Nova instância criada! {hasQRCode ? 'QR Code disponível para escaneamento.' : needsQRCode ? 'Clique em "Gerar QR Code" para conectar.' : 'Aguardando configuração...'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
