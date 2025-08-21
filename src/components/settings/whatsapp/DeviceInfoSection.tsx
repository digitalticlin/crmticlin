
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useWhatsAppInstanceStore } from '@/hooks/whatsapp/whatsappInstanceStore';

interface DeviceInfoSectionProps {
  instance?: any;
}

export const DeviceInfoSection: React.FC<DeviceInfoSectionProps> = ({ instance }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Dispositivo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Status da Bateria</label>
          <Progress 
            value={instance?.battery_level || 0} 
            className="mt-2"
            // Fix: Remove non-existent indicatorClassName prop
          />
          <span className="text-xs text-muted-foreground">
            {instance?.battery_level || 0}%
          </span>
        </div>
        
        <div>
          <label className="text-sm font-medium">Modelo do Dispositivo</label>
          <p className="text-sm text-muted-foreground">
            {instance?.device_model || 'Não disponível'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
