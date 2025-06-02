
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Clock, Smartphone, WifiOff, CheckCircle2, Zap, RefreshCw } from "lucide-react";

interface WhatsAppStatusCardProps {
  whatsappStatus: any;
  serverHealth: any;
  onDeploy?: () => void;
  onRefresh?: () => void;
  isDeploying?: boolean;
}

export const WhatsAppStatusCard = ({ 
  whatsappStatus, 
  serverHealth, 
  onDeploy, 
  onRefresh,
  isDeploying = false 
}: WhatsAppStatusCardProps) => {
  const isServerOnline = serverHealth?.isOnline === true;
  const StatusIcon = isServerOnline ? CheckCircle2 : WifiOff;
  const statusColor = isServerOnline ? 'text-green-600' : 'text-gray-500';
  const statusBg = isServerOnline ? 'bg-green-50' : 'bg-gray-50';
  const statusText = isServerOnline ? 'Servidor Online' : 'Servidor Offline';

  const activeInstances = serverHealth?.activeInstances || 0;
  const uptime = serverHealth?.uptime || 0;
  const version = serverHealth?.version || 'Unknown';

  // Format uptime
  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-900">WhatsApp Server</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${statusBg} ${statusColor} border-current`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusText}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isServerOnline ? (
          <div className="text-center py-6">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Servidor Offline</h3>
            <p className="text-gray-500 mb-4">
              O servidor WhatsApp permanente não está rodando
            </p>
            <Button 
              onClick={onDeploy}
              disabled={isDeploying}
              className="gap-2"
            >
              {isDeploying ? (
                <>
                  <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Implantando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Implantar Servidor
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Server Status */}
            <div className={`p-4 rounded-lg ${statusBg}`}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`h-6 w-6 ${statusColor}`} />
                <div>
                  <h4 className="font-medium text-gray-900">
                    Servidor WhatsApp Permanente v{version}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Uptime: {formatUptime(uptime)} | Instâncias ativas: {activeInstances}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-700">{activeInstances}</div>
                <div className="text-xs text-blue-600">WhatsApp Ativos</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Clock className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-700">{formatUptime(uptime)}</div>
                <div className="text-xs text-green-600">Tempo Online</div>
              </div>
            </div>

            {/* Server Features */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">✅ Recursos Ativados:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Servidor permanente com PM2</li>
                    <li>• Auto-reconexão em caso de queda</li>
                    <li>• Múltiplas instâncias simultâneas</li>
                    <li>• Webhook em tempo real</li>
                    <li>• Correções SSL e timeout aplicadas</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
