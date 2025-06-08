
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Loader2, Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { GlobalInstanceActions } from "./GlobalInstanceActions";

export const GlobalInstanceManagement = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Buscar instâncias do Supabase
  const { data: instances, isLoading, refetch } = useQuery({
    queryKey: ['global-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('connection_type', 'web')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000 // Auto-refresh a cada 30 segundos
  });

  const executeGlobalSync = async () => {
    setIsSyncing(true);
    
    try {
      console.log("🔄 Executando sincronização global manual...");
      toast.info("Iniciando sincronização global VPS ↔ Supabase...");

      // CORREÇÃO: Usar whatsapp_web_server APENAS para sync global
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'sync_all_instances'
        }
      });

      if (error) {
        console.error("❌ Erro na sincronização:", error);
        throw error;
      }

      if (data && data.success) {
        const summary = data.summary || {};
        const results = data.results || {};
        
        console.log("✅ Sincronização concluída:", results);
        
        setLastSync(new Date());
        refetch(); // Atualizar a lista de instâncias
        
        const successMsg = `Sincronização concluída! ${results.added || 0} adicionadas, ${results.updated || 0} atualizadas, ${results.orphans_linked || 0} órfãs vinculadas, ${results.orphans_deleted || 0} órfãs excluídas`;
        
        toast.success(successMsg);
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na sincronização';
        console.error("❌ Sincronização falhou:", errorMessage);
        toast.error(`Falha na sincronização: ${errorMessage}`);
      }
      
    } catch (error: any) {
      console.error("💥 Erro na sincronização:", error);
      toast.error(`Erro na sincronização: ${error.message || "Erro desconhecido"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const orphanCount = instances?.filter(i => !i.created_by_user_id).length || 0;
  const connectedCount = instances?.filter(i => ['open', 'ready'].includes(i.connection_status)).length || 0;

  return (
    <div className="space-y-6">
      {/* Painel de Controle */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            Gerenciamento Global de Instâncias
          </CardTitle>
          <p className="text-sm text-gray-600">
            Sincronize e monitore todas as instâncias WhatsApp entre VPS e Supabase
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Sincronização Manual</p>
              <p className="text-xs text-gray-500">
                {lastSync 
                  ? `Última execução: ${lastSync.toLocaleString()}`
                  : "Nunca executada nesta sessão"
                }
              </p>
            </div>
            
            <Button
              onClick={executeGlobalSync}
              disabled={isSyncing}
              className="gap-2"
              size="lg"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Sincronizar Agora
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{instances?.length || 0}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{connectedCount}</div>
              <div className="text-xs text-gray-500">Conectadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{orphanCount}</div>
              <div className="text-xs text-gray-500">Órfãs</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>🔄 Sincronização automática: A cada 10 minutos</p>
            <p>📡 Real-time: Mudanças instantâneas</p>
            <p>🔗 Vincula órfãs automaticamente</p>
            <p>🗑️ Exclui órfãs não vinculáveis</p>
            <p>🔒 Exclusão bidirecional VPS ↔ Supabase</p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Instâncias */}
      <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Instâncias Sincronizadas</span>
            <Badge variant="secondary">
              {instances?.length || 0} instâncias
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Carregando instâncias...</p>
            </div>
          ) : instances && instances.length > 0 ? (
            <div className="space-y-3">
              {instances.map((instance) => (
                <GlobalInstanceActions
                  key={instance.id}
                  instance={instance}
                  onRefresh={() => refetch()}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Nenhuma instância encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Execute a sincronização para importar instâncias da VPS
              </p>
              <Button onClick={executeGlobalSync} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Sincronizar Agora
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
