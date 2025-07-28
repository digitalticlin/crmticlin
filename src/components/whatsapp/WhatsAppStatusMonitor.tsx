
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Wifi, WifiOff } from 'lucide-react';

export const WhatsAppStatusMonitor = () => {
  // Simplified status monitoring without realtime dependency
  const connectionStatus = 'connected'; // Default status
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Status do WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus === 'connected' ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
