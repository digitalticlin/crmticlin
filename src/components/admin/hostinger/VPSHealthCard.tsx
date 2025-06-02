
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, HardDrive, Wifi, AlertTriangle, CheckCircle } from "lucide-react";

interface VPSHealthCardProps {
  vps: {
    id: string;
    name: string;
    status: string;
    cpu_cores: number;
    memory: number;
    storage: number;
    os: string;
    ip_address: string;
  } | null;
}

export const VPSHealthCard = ({ vps }: VPSHealthCardProps) => {
  if (!vps) {
    return (
      <Card className="border-gray-200">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum Servidor Selecionado</h3>
            <p className="text-gray-500">Selecione um servidor VPS para ver o status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOnline = vps.status === 'running';
  const StatusIcon = isOnline ? CheckCircle : AlertTriangle;
  const statusColor = isOnline ? 'text-green-600' : 'text-orange-500';
  const statusBg = isOnline ? 'bg-green-50' : 'bg-orange-50';
  const statusText = isOnline ? 'Servidor Online' : 'Servidor Offline';

  const formatMemory = (mb: number) => {
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb}MB`;
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-900">Estado do Servidor</CardTitle>
          <Badge variant="outline" className={`${statusBg} ${statusColor} border-current`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações Básicas */}
        <div className={`p-4 rounded-lg ${statusBg}`}>
          <div className="flex items-center gap-3 mb-3">
            <Wifi className={`h-5 w-5 ${statusColor}`} />
            <div>
              <h4 className="font-medium text-gray-900">{vps.name}</h4>
              <p className="text-sm text-gray-600">IP: {vps.ip_address}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">{vps.os}</p>
        </div>

        {/* Recursos do Servidor */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <Cpu className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-700">{vps.cpu_cores}</div>
            <div className="text-xs text-blue-600">Processadores</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <Activity className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-700">{formatMemory(vps.memory)}</div>
            <div className="text-xs text-green-600">Memória RAM</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <HardDrive className="h-6 w-6 text-purple-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-purple-700">{vps.storage}GB</div>
            <div className="text-xs text-purple-600">Armazenamento</div>
          </div>
        </div>

        {/* Status Explicativo */}
        {isOnline ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>✅ Seu servidor está funcionando perfeitamente!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span>⚠️ Servidor precisa ser ligado para funcionar</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
