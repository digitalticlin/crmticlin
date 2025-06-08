
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { executeDigitalticlinImport } from "@/utils/executeDigitalticlinImport";

export const AutoImportExecutor = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const handleExecuteImport = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await executeDigitalticlinImport();
      setExecutionResult({ success: true, data: result });
    } catch (error: any) {
      setExecutionResult({ success: false, error: error.message });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Play className="h-5 w-5" />
          Teste de Importação - digitalticlin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-700">
          <p>🎯 <strong>Objetivo:</strong> Validar se a função de importação está funcionando corretamente</p>
          <p>📋 <strong>Ação:</strong> Importar histórico completo da instância "digitalticlin"</p>
          <p>✅ <strong>Resultado esperado:</strong> Leads aparecem na página de chat ordenados por mensagem mais recente</p>
        </div>

        <Button
          onClick={handleExecuteImport}
          disabled={isExecuting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Executando Importação...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Executar Importação de Teste
            </>
          )}
        </Button>

        {executionResult && (
          <div className={`p-4 rounded-md border ${
            executionResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {executionResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                executionResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {executionResult.success ? 'Importação Executada com Sucesso!' : 'Erro na Importação'}
              </span>
            </div>
            
            {executionResult.success && executionResult.data?.summary && (
              <div className="text-sm text-green-700 space-y-1">
                <p>📊 <strong>Contatos importados:</strong> {executionResult.data.summary.contactsImported || 0}</p>
                <p>💬 <strong>Mensagens importadas:</strong> {executionResult.data.summary.messagesImported || 0}</p>
                <p className="mt-2 p-2 bg-green-100 rounded text-green-800">
                  ✅ <strong>Próximo passo:</strong> Acesse a página de Chat para ver os leads importados!
                </p>
              </div>
            )}
            
            {!executionResult.success && (
              <p className="text-sm text-red-700">
                {executionResult.error}
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <p><strong>ℹ️ Como validar:</strong></p>
          <p>1. Execute a importação clicando no botão acima</p>
          <p>2. Acesse a página "Chat" no menu lateral</p>
          <p>3. Verifique se os leads aparecem ordenados por mensagem mais recente</p>
          <p>4. Teste selecionar um lead e ver as últimas 50 mensagens</p>
        </div>
      </CardContent>
    </Card>
  );
};
