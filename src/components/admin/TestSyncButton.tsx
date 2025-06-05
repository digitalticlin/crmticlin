
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const TestSyncButton = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const executeSyncTest = async () => {
    setIsRunning(true);
    setResult(null);
    
    console.log("🔄 Executando teste de sincronização...");
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_instances'
        }
      });

      console.log("📥 Resposta da edge function:", data);
      console.log("❌ Erro (se houver):", error);

      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data && data.success) {
        toast.success("Sincronização executada com sucesso!");
      } else {
        toast.error("Falha na sincronização: " + (data?.error || "Erro desconhecido"));
      }
      
    } catch (error: any) {
      console.error("💥 Erro na sincronização:", error);
      setResult({ success: false, error: error.message });
      toast.error("Erro na sincronização: " + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-blue-500" />
          Teste de Sincronização VPS → Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={executeSyncTest}
          disabled={isRunning}
          className="gap-2 w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Executando Sincronização...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Executar Sincronização de Teste
            </>
          )}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-white/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">
                {result.success ? "Sucesso" : "Falha"}
              </span>
            </div>
            
            <pre className="text-xs bg-black/20 p-2 rounded overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
