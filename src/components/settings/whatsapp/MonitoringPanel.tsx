
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Monitor, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  User,
  Zap,
  Database,
  Webhook,
  QrCode
} from "lucide-react";

interface MonitoringLog {
  id: number;
  timestamp: string;
  step: string;
  status: 'pending' | 'success' | 'error';
  details: any;
  user: string;
}

interface MonitoringPanelProps {
  logs: MonitoringLog[];
  onClear: () => void;
}

export const MonitoringPanel = ({ logs, onClear }: MonitoringPanelProps) => {
  const getStepIcon = (step: string) => {
    if (step.includes('Requisição')) return <User className="h-4 w-4" />;
    if (step.includes('Edge Function')) return <Zap className="h-4 w-4" />;
    if (step.includes('VPS') || step.includes('Instância')) return <Database className="h-4 w-4" />;
    if (step.includes('Webhook')) return <Webhook className="h-4 w-4" />;
    if (step.includes('QR')) return <QrCode className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600 text-white">✅ Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">❌ Erro</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">⏳ Aguardando</Badge>;
      default:
        return <Badge variant="outline">? Desconhecido</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatDetails = (details: any) => {
    if (!details || Object.keys(details).length === 0) return null;
    
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
        <pre className="text-gray-600 whitespace-pre-wrap">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            <span>Monitoramento em Tempo Real</span>
            <Badge variant="outline" className="ml-2">
              {logs.length} eventos
            </Badge>
          </div>
          <Button
            onClick={onClear}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum evento monitorado ainda</p>
            <p className="text-sm">Clique em "Conectar WhatsApp" para iniciar o monitoramento</p>
          </div>
        ) : (
          <ScrollArea className="h-96 w-full">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStepIcon(log.step)}
                      <span className="font-medium text-sm">{log.step}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(log.status)}
                    <span className="text-sm text-gray-600">
                      Usuário: {log.user}
                    </span>
                  </div>
                  
                  {formatDetails(log.details)}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
