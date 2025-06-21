
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ChatHistoryImporterProps {
  instanceId: string;
  instanceName: string;
  isConnected: boolean;
  historyImported: boolean;
  onImportComplete: () => void;
}

export const ChatHistoryImporter = ({ 
  instanceId, 
  instanceName, 
  isConnected, 
  historyImported,
  onImportComplete 
}: ChatHistoryImporterProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleImportHistory = async () => {
    if (!isConnected) {
      toast.error("Instância não está conectada");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      console.log(`[Chat History Importer] 📥 Importando histórico para: ${instanceName}`, {
        instanceId
      });

      const { data, error } = await supabase.functions.invoke('whatsapp_chat_import', {
        body: {
          action: 'import_data',
          instanceId: instanceId,
          importType: 'both', // contatos e mensagens
          batchSize: 50 // limitar a 50 mensagens por chat
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`[Chat History Importer] ✅ Resultado:`, data);
      setImportResult(data);

      if (data.success) {
        // Marcar como importado - usando um campo personalizado na sessão ou estado local
        // Como não temos o campo no banco, vamos usar localStorage
        localStorage.setItem(`history_imported_${instanceId}`, 'true');

        const { contactsImported, messagesImported } = data.summary || {};
        toast.success(`Histórico importado! ${contactsImported || 0} contatos e ${messagesImported || 0} mensagens.`);
        
        // Notificar componente pai para atualizar estado
        onImportComplete();
      } else {
        toast.error(`Erro na importação: ${data.error || 'Erro desconhecido'}`);
      }

    } catch (error: any) {
      console.error(`[Chat History Importer] ❌ Erro:`, error);
      toast.error(`Erro ao importar histórico: ${error.message}`);
      setImportResult({ success: false, error: error.message });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Conecte a instância para importar histórico</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Verificar se já foi importado via localStorage
  const isImported = historyImported || localStorage.getItem(`history_imported_${instanceId}`) === 'true';

  // Se já foi importado, mostrar apenas informação
  if (isImported) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Histórico já importado</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            As mensagens agora aparecem em tempo real no chat
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-green-600" />
          Importar Histórico - {instanceName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>📋 Esta função irá importar todos os contatos e as últimas 50 mensagens de cada chat.</p>
          <p>🎯 Os leads serão criados automaticamente e aparecerão na página de chat.</p>
          <p className="text-amber-600 font-medium">⚠️ Use apenas uma vez - após isso as mensagens aparecerão em tempo real.</p>
        </div>

        <Button
          onClick={handleImportHistory}
          disabled={isImporting}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importando Histórico...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Importar Histórico Completo
            </>
          )}
        </Button>

        {importResult && (
          <div className={`p-3 rounded-md border ${
            importResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {importResult.success ? 'Sucesso' : 'Erro'}
              </span>
            </div>
            
            {importResult.success && importResult.summary && (
              <div className="mt-2 text-sm text-green-700">
                <p>✅ {importResult.summary.contactsImported || 0} contatos importados</p>
                <p>✅ {importResult.summary.messagesImported || 0} mensagens importadas</p>
                <p>🎯 Leads criados automaticamente no funil</p>
              </div>
            )}
            
            {!importResult.success && (
              <p className="mt-1 text-sm text-red-700">
                {importResult.error}
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
          💡 <strong>Dica:</strong> Após a importação, todos os chats aparecerão automaticamente 
          na página de Chat, organizados por mensagem mais recente.
        </div>
      </CardContent>
    </Card>
  );
};
