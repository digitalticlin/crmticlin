
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
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useChatImport } from "@/hooks/whatsapp/useChatImport";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { useEffect } from "react";

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

  // Carregar status na inicialização
  useEffect(() => {
    if (instance.id) {
      getImportStatus(instance.id);
    }
  }, [instance.id]);

  const isConnected = ['connected', 'ready', 'open'].includes(instance.connection_status);
  const hasImportHistory = importStatus?.contactsImported > 0 || importStatus?.messagesImported > 0;

  const handleFullImport = () => {
    importData(instance.id, 'both', 30);
  };

  const handleContactsOnly = () => {
    importData(instance.id, 'contacts', 50);
  };

  const handleMessagesOnly = () => {
    importData(instance.id, 'messages', 30);
  };

  const handleSyncNew = () => {
    syncNewMessages(instance.id);
  };

  const handleRefreshStatus = () => {
    getImportStatus(instance.id);
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
        <div className="flex items-center gap-2">
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

        {/* Dica */}
        <div className="bg-blue-50/50 p-3 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Dica:</strong> A importação é automática quando você conecta uma nova instância. 
            Use a sincronização manual para buscar mensagens mais recentes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
