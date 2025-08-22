import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WhatsAppInstance } from '@/hooks/whatsapp/whatsappInstanceStore';

interface InstanceHeaderProps {
  instance: WhatsAppInstance;
}

export const InstanceHeader = ({ instance }: InstanceHeaderProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{instance.instance_name}</span>
          <Badge variant={instance.connection_status === 'connected' ? 'default' : 'secondary'}>
            {instance.connection_status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Phone:</span>
            <span>{instance.phone || 'Not connected'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Profile:</span>
            <span>{instance.profile_name || 'Not available'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Status:</span>
            <span>{instance.web_status || 'Unknown'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Connected:</span>
            <span>{instance.date_connected ? new Date(instance.date_connected).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
