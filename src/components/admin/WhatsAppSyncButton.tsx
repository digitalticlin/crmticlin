
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const WhatsAppSyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [autoSyncStatus, setAutoSyncStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      
      console.log("🔄 Iniciando sincronização manual das instâncias WhatsApp...");
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_instances'
        }
      });

      if (error) {
        console.error("❌ Erro na invocação da função:", error);
        throw error;
      }

      console.log("✅ Resultado da sincronização:", data);
      
      if (data && data.success) {
        const summary = data.data || {};
        setLastSync(new Date().toLocaleString());
        toast.success(
          `Sincronização manual concluída! 
          Atualizadas: ${summary.updatedCount || 0}, 
          Criadas: ${summary.createdCount || 0}, 
          Total VPS: ${summary.vpsInstancesCount || 0}`
        );
      } else {
        const errorMessage = data?.error || "Erro desconhecido na sincronização";
        console.error("❌ Sincronização falhou:", errorMessage);
        toast.error(`Erro na sincronização: ${errorMessage}`);
      }
      
    } catch (error: any) {
      console.error("💥 Erro na sincronização:", error);
      toast.error(`Erro na sincronização: ${error.message || "Erro desconhecido"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const checkAutoSyncStatus = async () => {
    try {
      // Verificar logs recentes de sincronização automática
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('function_name', 'auto_sync_instances')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const lastLog = data[0];
        const lastLogTime = new Date(lastLog.created_at).getTime();
        const now = new Date().getTime();
        const diffMinutes = (now - lastLogTime) / (1000 * 60);

        // Se teve log nas últimas 15 minutos, considera ativo
        setAutoSyncStatus(diffMinutes <= 15 ? 'active' : 'inactive');
        
        if (lastLog.status === 'success') {
          setLastSync(new Date(lastLog.created_at).toLocaleString());
        }
      } else {
        setAutoSyncStatus('inactive');
      }
    } catch (error) {
      console.error("Erro ao verificar status da sincronização automática:", error);
      setAutoSyncStatus('unknown');
    }
  };

  // Verificar status da sincronização automática ao carregar
  useState(() => {
    checkAutoSyncStatus();
    // Verificar a cada 2 minutos
    const interval = setInterval(checkAutoSyncStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  });

  const getStatusIcon = () => {
    switch (autoSyncStatus) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (autoSyncStatus) {
      case 'active':
        return 'Auto-sync ativo';
      case 'inactive':
        return 'Auto-sync inativo';
      default:
        return 'Status desconhecido';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleManualSync}
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
              Sincronizar Manualmente
            </>
          )}
        </Button>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>
      
      {lastSync && (
        <p className="text-xs text-muted-foreground">
          Última sincronização: {lastSync}
        </p>
      )}
    </div>
  );
};
