
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Trash2, 
  Smartphone, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp,
  History
} from "lucide-react";
import { WhatsAppWebInstance } from "@/types/whatsapp";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChatImporter } from "./ChatImporter";
import { ChatHistoryImporter } from "./ChatHistoryImporter";

interface SimpleInstanceCardProps {
  instance: WhatsAppWebInstance;
  onGenerateQR: (instanceId: string, instanceName: string) => void;
  onDelete: (instanceId: string) => void;
  onRefreshQRCode: (instanceId: string) => Promise<{ qrCode?: string; success?: boolean; waiting?: boolean; connected?: boolean } | null>;
}

export const SimpleInstanceCard = ({ 
  instance, 
  onGenerateQR, 
  onDelete,
  onRefreshQRCode 
}: SimpleInstanceCardProps) => {
  const [showImporter, setShowImporter] = useState(false);
  const [showHistoryImporter, setShowHistoryImporter] = useState(false);
  const [localHistoryImported, setLocalHistoryImported] = useState(instance.history_imported || false);

  const getStatusInfo = () => {
    const status = instance.connection_status?.toLowerCase() || 'unknown';
    
    switch (status) {
      case 'ready':
      case 'connected':
        return {
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
          text: 'Conectado',
          description: 'WhatsApp conectado e funcionando'
        };
      case 'connecting':
      case 'initializing':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          text: 'Conectando',
          description: 'Estabelecendo conexão...'
        };
      case 'qr_generated':
      case 'waiting_scan':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: QrCode,
          text: 'Aguardando QR',
          description: 'Escaneie o QR Code'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: AlertTriangle,
          text: 'Desconhecido',
          description: 'Status não identificado'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const isConnected = ['ready', 'connected'].includes(instance.connection_status?.toLowerCase() || '');

  const handleImportComplete = () => {
    setLocalHistoryImported(true);
    setShowHistoryImporter(false);
  };

  return (
    <Card className="bg-white border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {instance.instance_name}
            </h3>
            {instance.phone && (
              <p className="text-sm text-gray-600">
                📱 {instance.phone}
              </p>
            )}
          </div>
          
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>{statusInfo.description}</p>
          {instance.date_connected && (
            <p className="text-xs mt-1">
              Conectado: {new Date(instance.date_connected).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {!isConnected && (
            <Button
              onClick={() => onGenerateQR(instance.id, instance.instance_name)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Gerar QR Code
            </Button>
          )}
          
          <Button
            onClick={() => onDelete(instance.id)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Seções de Importação para instâncias conectadas */}
        {isConnected && (
          <div className="space-y-2">
            {/* Importação de Chat Individual */}
            <Collapsible open={showImporter} onOpenChange={setShowImporter}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline" 
                  className="w-full flex items-center justify-between"
                  size="sm"
                >
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Importar Chat Individual
                  </div>
                  {showImporter ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3">
                <ChatImporter
                  instanceId={instance.id}
                  instanceName={instance.instance_name}
                  isConnected={isConnected}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Importação de Histórico Completo - só mostrar se não foi importado */}
            {!localHistoryImported && (
              <Collapsible open={showHistoryImporter} onOpenChange={setShowHistoryImporter}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline" 
                    className="w-full flex items-center justify-between bg-green-50 border-green-200 hover:bg-green-100"
                    size="sm"
                  >
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-green-600" />
                      <span className="text-green-700">Importar Histórico Completo</span>
                    </div>
                    {showHistoryImporter ? (
                      <ChevronUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-3">
                  <ChatHistoryImporter
                    instanceId={instance.id}
                    instanceName={instance.instance_name}
                    isConnected={isConnected}
                    historyImported={localHistoryImported}
                    onImportComplete={handleImportComplete}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Mostrar mensagem quando histórico já foi importado */}
            {localHistoryImported && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Histórico importado</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Mensagens agora aparecem em tempo real no chat
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
