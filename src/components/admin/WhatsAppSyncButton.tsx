
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const WhatsAppSyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      console.log("Iniciando sincronização global das instâncias WhatsApp...");
      
      const { data, error } = await supabase.functions.invoke('sync_all_whatsapp_instances', {
        body: {}
      });

      if (error) {
        console.error("Erro na invocação da função:", error);
        throw error;
      }

      console.log("Resultado da sincronização:", data);
      
      // Verificar se a resposta indica sucesso
      if (data && data.success) {
        const summary = data.summary || {};
        toast.success(
          `Sincronização concluída com sucesso! 
          Atualizadas: ${summary.updated || 0}, 
          Inseridas: ${summary.inserted || 0}, 
          Removidas: ${summary.deleted || 0}${summary.errors > 0 ? `, Erros: ${summary.errors}` : ''}`
        );
      } else {
        // Se data.success é false, mostrar o erro específico
        const errorMessage = data?.error || "Erro desconhecido na sincronização";
        console.error("Sincronização falhou:", errorMessage);
        toast.error(`Erro na sincronização: ${errorMessage}`);
      }
      
    } catch (error: any) {
      console.error("Erro na sincronização:", error);
      toast.error(`Erro na sincronização: ${error.message || "Erro desconhecido"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isSyncing}
      className="gap-2"
      variant="outline"
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sincronizando...
        </>
      ) : (
        <>
          <RefreshCcw className="h-4 w-4" />
          Sincronizar com Evolution API
        </>
      )}
    </Button>
  );
};
