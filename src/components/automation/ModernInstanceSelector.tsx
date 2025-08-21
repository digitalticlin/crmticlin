
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, WifiOff, CheckCircle } from "lucide-react";
import { useWhatsAppWebInstances } from "@/hooks/whatsapp/useWhatsAppWebInstances";

interface ModernInstanceSelectorProps {
  selectedInstanceId?: string;
  onInstanceSelect: (instanceId: string) => void;
}

export function ModernInstanceSelector({ selectedInstanceId, onInstanceSelect }: ModernInstanceSelectorProps) {
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
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <Wifi className="w-3 h-3 mr-1" />
            Conectado
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            <WifiOff className="w-3 h-3 mr-1" />
            Desconectado
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <ModernCard className="animate-pulse">
        <ModernCardContent className="p-4">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-10 bg-white/20 rounded"></div>
        </ModernCardContent>
      </ModernCard>
    );
  }

  return (
    <ModernCard>
      <ModernCardHeader>
        <ModernCardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Instância WhatsApp
        </ModernCardTitle>
      </ModernCardHeader>

      <ModernCardContent className="space-y-4">
        {connectedInstances.length === 0 ? (
          <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Nenhuma instância conectada
                </p>
                <p className="text-xs text-amber-700">
                  Conecte uma instância WhatsApp para criar campanhas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Select value={selectedInstanceId} onValueChange={onInstanceSelect}>
              <SelectTrigger className="bg-white/50 border-white/20">
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
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Instâncias disponíveis */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Instâncias disponíveis:
              </p>
              {connectedInstances.map(instance => (
                <div key={instance.id} className="flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">{instance.instance_name}</p>
                      {instance.phone && (
                        <p className="text-sm text-muted-foreground">{instance.phone}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(instance.connection_status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instância selecionada */}
        {selectedInstanceId && (
          <div className="bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-lg p-4">
            {(() => {
              const selectedInstance = instances.find(i => i.id === selectedInstanceId);
              return selectedInstance ? (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      {selectedInstance.instance_name} selecionada
                    </p>
                    {selectedInstance.phone && (
                      <p className="text-sm text-green-700">
                        {selectedInstance.phone}
                      </p>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </ModernCardContent>
    </ModernCard>
  );
}
