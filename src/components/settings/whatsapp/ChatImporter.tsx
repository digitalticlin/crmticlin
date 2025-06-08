
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ChatImporterProps {
  instanceId: string;
  instanceName: string;
  isConnected: boolean;
}

export const ChatImporter = ({ instanceId, instanceName, isConnected }: ChatImporterProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleImportChat = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Digite um número de telefone");
      return;
    }

    if (!isConnected) {
      toast.error("Instância não está conectada");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      console.log(`[Chat Importer] 📥 Importando chat para: ${instanceName}`, {
        instanceId,
        phoneNumber: phoneNumber.trim()
      });

      const { data, error } = await supabase.functions.invoke('whatsapp_chat_import', {
        body: {
          action: 'import_chat',
          instanceId: instanceId,
          phoneNumber: phoneNumber.trim(),
          instanceName: instanceName
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`[Chat Importer] ✅ Resultado:`, data);
      setImportResult(data);

      if (data.success) {
        toast.success(`Chat importado com sucesso! ${data.messagesCount || 0} mensagens encontradas.`);
      } else {
        toast.error(`Erro na importação: ${data.error}`);
      }

    } catch (error: any) {
      console.error(`[Chat Importer] ❌ Erro:`, error);
      toast.error(`Erro ao importar chat: ${error.message}`);
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
            <span className="text-sm">Conecte a instância para importar chats</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-600" />
          Importar Chat - {instanceName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Número do WhatsApp</Label>
          <Input
            id="phoneNumber"
            type="text"
            placeholder="5511999999999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isImporting}
          />
          <p className="text-xs text-gray-500">
            Digite apenas números (DDI + DDD + número)
          </p>
        </div>

        <Button
          onClick={handleImportChat}
          disabled={isImporting || !phoneNumber.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Importar Chat
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
            
            {importResult.success && (
              <div className="mt-2 text-sm text-green-700">
                <p>✅ {importResult.messagesCount || 0} mensagens importadas</p>
                <p>✅ {importResult.leadsCount || 0} leads processados</p>
                {importResult.newLeadsCount > 0 && (
                  <p>🆕 {importResult.newLeadsCount} novos leads criados</p>
                )}
              </div>
            )}
            
            {!importResult.success && (
              <p className="mt-1 text-sm text-red-700">
                {importResult.error}
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          💡 <strong>Dica:</strong> A importação busca mensagens do chat especificado 
          e cria leads automaticamente no seu CRM.
        </div>
      </CardContent>
    </Card>
  );
};
