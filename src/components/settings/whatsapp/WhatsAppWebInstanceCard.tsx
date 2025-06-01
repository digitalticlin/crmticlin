
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Trash2, RefreshCw, Phone, Wifi } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WhatsAppWebInstanceCardProps {
  instance: WhatsAppWebInstance;
  onDelete: (instanceId: string) => Promise<void>;
  onRefreshQR: (instanceId: string) => Promise<string>;
  onSyncStatus?: (instanceId: string) => Promise<any>;
  onShowQR?: (instanceId: string) => void;
  isNewInstance?: boolean;
}

export function WhatsAppWebInstanceCard({ 
  instance, 
  onDelete, 
  onRefreshQR,
  onSyncStatus,
  onShowQR,
  isNewInstance = false
}: WhatsAppWebInstanceCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
      case 'open':
        return 'bg-green-500';
      case 'connecting':
      case 'waiting_scan':
      case 'creating':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Conectado';
      case 'open':
        return 'Online';
      case 'connecting':
        return 'Conectando';
      case 'waiting_scan':
        return 'Aguardando QR';
      case 'creating':
        return 'Criando';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
      default:
        return status;
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover esta instância?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete(instance.id);
    } catch (error) {
      console.error('[WhatsAppWebInstanceCard] Error deleting instance:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefreshQR = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshQR(instance.id);
      setShowQR(true);
    } catch (error) {
      console.error('[WhatsAppWebInstanceCard] Error refreshing QR:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSyncStatus = async () => {
    if (!onSyncStatus) return;
    
    setIsSyncing(true);
    try {
      console.log('[WhatsAppWebInstanceCard] Syncing status for instance:', instance.id);
      await onSyncStatus(instance.id);
    } catch (error) {
      console.error('[WhatsAppWebInstanceCard] Error syncing status:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleShowQR = () => {
    console.log('[WhatsAppWebInstanceCard] Showing QR for instance:', instance.id, instance.web_status);
    if (onShowQR) {
      onShowQR(instance.id);
    } else {
      if (instance.qr_code) {
        setShowQR(true);
      } else {
        handleRefreshQR();
      }
    }
  };

  const needsQRCode = ['waiting_scan', 'connecting', 'creating'].includes(instance.web_status || instance.connection_status);
  const canReconnect = instance.web_status === 'disconnected';
  const isConnected = ['ready', 'open'].includes(instance.web_status || instance.connection_status);
  const canSync = instance.vps_instance_id && !isConnected;

  console.log('[WhatsAppWebInstanceCard] Instance status check:', {
    id: instance.id,
    web_status: instance.web_status,
    connection_status: instance.connection_status,
    phone: instance.phone,
    needsQRCode,
    canReconnect,
    isConnected,
    canSync
  });

  return (
    <>
      <Card className={`relative ${isNewInstance ? 'ring-2 ring-green-400 ring-opacity-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-600" />
              <CardTitle className="text-lg">WhatsApp Web</CardTitle>
            </div>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(instance.web_status || instance.connection_status)} text-white`}
            >
              {getStatusText(instance.web_status || instance.connection_status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Instância: {instance.instance_name}
          </p>
          {instance.phone && (
            <div className="flex items-center gap-1 text-green-600">
              <Phone className="h-3 w-3" />
              <span className="text-xs font-medium">{instance.phone}</span>
            </div>
          )}
          {instance.profile_name && (
            <p className="text-xs text-muted-foreground">
              Perfil: {instance.profile_name}
            </p>
          )}
          {!isConnected && !instance.phone && (
            <p className="text-xs text-amber-600 font-medium">
              {needsQRCode ? 'Aguardando conexão...' : 'Desconectado'}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex gap-2 flex-wrap">
            {needsQRCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowQR}
                disabled={isRefreshing}
                className="flex-1"
              >
                <QrCode className="h-4 w-4 mr-1" />
                {isRefreshing ? 'Carregando...' : 'Ver QR Code'}
              </Button>
            )}
            
            {canReconnect && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshQR}
                disabled={isRefreshing}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Reconectar
              </Button>
            )}

            {canSync && onSyncStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncStatus}
                disabled={isSyncing}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Verificar Status'}
              </Button>
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isDeleting ? 'Removendo...' : 'Remover'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog local para QR code quando não usar modal externo */}
      {!onShowQR && (
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Conectar WhatsApp</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-4">
              {instance.qr_code ? (
                <>
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <img 
                      src={instance.qr_code} 
                      alt="QR Code WhatsApp" 
                      className="w-64 h-64"
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    1. Abra o WhatsApp no seu celular<br/>
                    2. Vá em Menu → Aparelhos conectados<br/>
                    3. Toque em "Conectar um aparelho"<br/>
                    4. Escaneie este QR code
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <p>QR Code não disponível. Tente gerar um novo.</p>
                  <Button 
                    onClick={handleRefreshQR} 
                    disabled={isRefreshing}
                    className="mt-4"
                  >
                    {isRefreshing ? 'Gerando...' : 'Gerar QR Code'}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefreshQR}
                disabled={isRefreshing}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowQR(false)}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
