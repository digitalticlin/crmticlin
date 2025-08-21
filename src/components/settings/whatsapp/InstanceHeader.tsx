
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWhatsAppInstanceStore } from '@/hooks/whatsapp/whatsappInstanceStore';

interface InstanceHeaderProps {
  instance?: any;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const InstanceHeader: React.FC<InstanceHeaderProps> = ({ 
  instance, 
  onConnect, 
  onDisconnect 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold">{instance?.instance_name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <Badge className={getStatusColor(instance?.connection_status)}>
            {instance?.connection_status || 'disconnected'}
          </Badge>
          {instance?.phone && (
            <span className="text-sm text-muted-foreground">
              {instance.phone}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        {instance?.connection_status === 'connected' ? (
          <Button onClick={onDisconnect} variant="destructive">
            Desconectar
          </Button>
        ) : (
          <Button onClick={onConnect}>
            Conectar
          </Button>
        )}
      </div>
    </div>
  );
};
