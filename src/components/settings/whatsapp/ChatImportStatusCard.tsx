
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  RefreshCw, 
  MessageSquare, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useChatImport } from "@/hooks/whatsapp/useChatImport";
import { WhatsAppWebInstance } from "@/types/whatsapp";
import { useEffect, useState } from "react";

interface ChatImportStatusCardProps {
  instance: WhatsAppWebInstance;
}

export const ChatImportStatusCard = ({ instance }: ChatImportStatusCardProps) => {
  const { 
    isImporting, 
    importStatus, 
    isLoadingStatus,
    getImportStatus,
    importData,
    syncNewMessages
  } = useChatImport();

  const [lastResult, setLastResult] = useState<any>(null);

  // Carregar status na inicialização
  useEffect(() => {
    if (instance.id) {
      getImportStatus(instance.id);
    }
  }, [instance.id]);

  const isConnected = ['connected', 'ready', 'open'].includes(instance.connection_status);
  const hasImportHistory = importStatus?.contactsImported > 0 || importStatus?.messagesImported > 0;

  const handleFullImport = async () => {
    const result = await importData(instance.id, 'both', 30);
    setLastResult(result);
  };

  const handleContactsOnly = async () => {
    const result = await importData(instance.id, 'contacts', 50);
    setLastResult(result);
  };

  const handleMessagesOnly = async () => {
    const result = await importData(instance.id, 'messages', 30);
    setLastResult(result);
  };

  const handleSyncNew = async () => {
    const result = await syncNewMessages(instance.id);
    setLastResult(result);
  };

  const handleRefreshStatus = () => {
    getImportStatus(instance.id);
    setLastResult(null);
  };

  if (!isConnected) {
    return (
      <Card className="bg-gray-50/50 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Importação de Chats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Conecte a instância para importar conversas e contatos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Importação de Chats
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshStatus}
            disabled={isLoadingStatus}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status da Importação */}
        {importStatus && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Contatos</span>
              </div>
              <p className="text-lg font-bold text-green-900">
                {importStatus.contactsImported.toLocaleString()}
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Mensagens</span>
              </div>
              <p className="text-lg font-bold text-blue-900">
                {importStatus.messagesImported.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Última Sincronização */}
        {importStatus?.lastSyncAt && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              Última sync: {formatDistanceToNow(new Date(importStatus.lastSyncAt), {
                addSuffix: true,
                locale: ptBR
              })}
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasImportHistory ? (
            <Badge variant="outline" className="border-green-300 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Histórico Importado
            </Badge>
          ) : (
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              <AlertCircle className="h-3 w-3 mr-1" />
              Aguardando Importação
            </Badge>
          )}

          {instance.history_imported && (
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              Sync Automática
            </Badge>
          )}
        </div>

        {/* Resultado da Última Operação */}
        {lastResult && (
          <div className={`p-3 rounded-lg border ${
            lastResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                lastResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastResult.success ? 'Importação Concluída' : 'Erro na Importação'}
              </span>
            </div>
            
            {lastResult.success && lastResult.summary && (
              <div className="space-y-1 text-xs text-green-700">
                <p>✅ {lastResult.summary.contactsImported || 0} contatos importados</p>
                <p>✅ {lastResult.summary.messagesImported || 0} mensagens importadas</p>
                {lastResult.summary.totalImported === 0 && (
                  <p className="flex items-center gap-1 text-blue-700">
                    <Info className="h-3 w-3" />
                    Esta instância pode não ter histórico disponível no VPS
                  </p>
                )}
              </div>
            )}
            
            {!lastResult.success && (
              <p className="text-xs text-red-700">
                {lastResult.error}
              </p>
            )}
          </div>
        )}

        {/* Botões de Ação */}
        <div className="space-y-2">
          {!hasImportHistory ? (
            // Primeira importação
            <div className="space-y-2">
              <Button
                onClick={handleFullImport}
                disabled={isImporting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                {isImporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Importar Todos os Dados
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleContactsOnly}
                  disabled={isImporting}
                  variant="outline"
                  size="sm"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Contatos
                </Button>
                <Button
                  onClick={handleMessagesOnly}
                  disabled={isImporting}
                  variant="outline"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Mensagens
                </Button>
              </div>
            </div>
          ) : (
            // Sincronização incremental
            <div className="space-y-2">
              <Button
                onClick={handleSyncNew}
                disabled={isImporting}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {isImporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sincronizar Novas Mensagens
              </Button>
              
              <Button
                onClick={handleFullImport}
                disabled={isImporting}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Reimportar Tudo
              </Button>
            </div>
          )}
        </div>

        {/* Dicas */}
        <div className="bg-blue-50/50 p-3 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Dica:</strong> Se a importação retornar 0 itens, a instância pode não ter histórico 
            disponível no VPS ou pode ser necessário reconectar o WhatsApp.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
