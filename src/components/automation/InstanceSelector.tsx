
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useWhatsAppWebInstances } from '@/hooks/whatsapp/useWhatsAppWebInstances';

interface InstanceSelectorProps {
  selectedInstanceId?: string;
  onInstanceSelect: (instanceId: string) => void;
}

export const InstanceSelector: React.FC<InstanceSelectorProps> = ({
  selectedInstanceId,
  onInstanceSelect
}) => {
  const { instances, isLoading } = useWhatsAppWebInstances();

  const connectedInstances = instances.filter(
    instance => ['connected', 'ready', 'open'].includes(instance.connection_status)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'ready':
      case 'open':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            <Wifi className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
            <WifiOff className="w-3 h-3 mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Instância WhatsApp
        </Label>

        {connectedInstances.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Nenhuma instância WhatsApp conectada. 
              <br />
              Conecte uma instância para criar campanhas.
            </p>
          </div>
        ) : (
          <Select value={selectedInstanceId} onValueChange={onInstanceSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma instância" />
            </SelectTrigger>
            <SelectContent>
              {connectedInstances.map(instance => (
                <SelectItem key={instance.id} value={instance.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{instance.instance_name}</span>
                      {instance.phone && (
                        <span className="text-gray-500">({instance.phone})</span>
                      )}
                    </div>
                    {getStatusBadge(instance.connection_status)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedInstanceId && (
          <div className="bg-green-50 p-3 rounded-lg">
            {(() => {
              const selectedInstance = instances.find(i => i.id === selectedInstanceId);
              return selectedInstance ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-700">
                    {selectedInstance.instance_name} selecionada
                    {selectedInstance.phone && ` (${selectedInstance.phone})`}
                  </span>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
