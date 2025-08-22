import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WhatsAppInstance } from '@/hooks/whatsapp/whatsappInstanceStore';

interface DeviceInfoSectionProps {
  instance: WhatsAppInstance;
}

export const DeviceInfoSection = ({ instance }: DeviceInfoSectionProps) => {
  const batteryLevel = 85; // Mock battery level
  const signalStrength = 70; // Mock signal strength

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Signal Strength</span>
            <span>{signalStrength}%</span>
          </div>
          <Progress 
            value={signalStrength} 
            className="h-2"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Battery Level</span>
            <span>{batteryLevel}%</span>
          </div>
          <Progress 
            value={batteryLevel} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};
