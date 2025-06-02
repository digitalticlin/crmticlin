
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal, 
  Eye, 
  Activity, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface VPSMonitoringCardProps {
  logs: string;
  whatsappStatus: any;
  isServerOnline: boolean;
  onLoadLogs: (lines: number) => void;
}

export const VPSMonitoringCard = ({
  logs,
  whatsappStatus,
  isServerOnline,
  onLoadLogs
}: VPSMonitoringCardProps) => {
  const [showLogs, setShowLogs] = useState(false);

  // Simular alguns eventos recentes para exemplo
  const recentEvents = [
    { time: "14:32", type: "success", message: "WhatsApp conectado com sucesso" },
    { time: "14:30", type: "info", message: "Servidor iniciado" },
    { time: "14:28", type: "warning", message: "Reinicialização programada" }
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'success': return <Badge className="bg-green-100 text-green-800 text-xs">Sucesso</Badge>;
      case 'warning': return <Badge className="bg-orange-100 text-orange-800 text-xs">Atenção</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800 text-xs">Erro</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-800 text-xs">Info</Badge>;
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-900">Monitoramento</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowLogs(!showLogs)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              {showLogs ? 'Ocultar' : 'Ver'} Detalhes
            </Button>
            <Button
              onClick={() => onLoadLogs(50)}
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={!isServerOnline}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isServerOnline ? (
          <div className="text-center py-6">
            <Terminal className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">Monitoramento Offline</h3>
            <p className="text-gray-500">Ligue o servidor para ver as atividades</p>
          </div>
        ) : (
          <>
            {/* Status Rápido */}
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Sistema Funcionando</span>
              </div>
              <p className="text-sm text-green-700">
                Última verificação: {new Date().toLocaleTimeString()}
              </p>
            </div>

            {/* Eventos Recentes */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Atividades Recentes
              </h4>
              <div className="space-y-2">
                {recentEvents.map((event, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    {getEventIcon(event.type)}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{event.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{event.time}</span>
                      {getEventBadge(event.type)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Logs Técnicos (Opcionais) */}
            {showLogs && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Logs Técnicos
                </h4>
                <ScrollArea className="h-32 w-full border rounded">
                  <div className="p-3">
                    {logs ? (
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {logs}
                      </pre>
                    ) : (
                      <p className="text-xs text-gray-500 italic">
                        Nenhum log disponível. Clique em "Atualizar" para carregar.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Dicas */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="font-medium text-blue-900 text-sm mb-1">💡 Dicas de Monitoramento:</h5>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Verde = Tudo funcionando perfeitamente</li>
                <li>• Laranja = Atenção, mas ainda funcionando</li>
                <li>• Vermelho = Problema que precisa de atenção</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
