
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WhatsAppWebInstance } from '@/types/whatsapp';
import { Badge } from '@/components/ui/badge';

interface WhatsAppInstanceSelectorProps {
  instances: WhatsAppWebInstance[];
  activeInstance: WhatsAppWebInstance | null;
  onInstanceChange: (instance: WhatsAppWebInstance | null) => void;
  isLoading?: boolean;
}

export const WhatsAppInstanceSelector: React.FC<WhatsAppInstanceSelectorProps> = ({
  instances,
  activeInstance,
  onInstanceChange,
  isLoading = false
}) => {
  const handleValueChange = (instanceId: string) => {
    const instance = instances.find(i => i.id === instanceId);
    onInstanceChange(instance || null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-9 bg-white/20 rounded-md"></div>
      </div>
    );
  }

  return (
    <Select
      value={activeInstance?.id || ''}
      onValueChange={handleValueChange}
      disabled={instances.length === 0}
    >
      <SelectTrigger className="bg-white/20 border-white/30 text-white">
        <SelectValue placeholder="Selecione uma instância..." />
      </SelectTrigger>
      <SelectContent>
        {instances.map((instance) => (
          <SelectItem key={instance.id} value={instance.id}>
            <div className="flex items-center gap-2">
              <span>{instance.instance_name}</span>
              <Badge 
                variant={instance.connection_status === 'connected' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {instance.connection_status}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
