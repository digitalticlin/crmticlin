
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Database,
  Users,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstanceStats {
  total: number;
  connected: number;
  disconnected: number;
  orphaned: number;
}

export const GlobalInstanceActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<InstanceStats>({
    total: 0,
    connected: 0,
    disconnected: 0,
    orphaned: 0
  });

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      const { data: instances, error } = await supabase
        .from('whatsapp_instances')
        .select('connection_status, created_by_user_id');

      if (error) throw error;

      const total = instances?.length || 0;
      const connected = instances?.filter(i => 
        i.connection_status === 'connected' || i.connection_status === 'ready'
      ).length || 0;
      const disconnected = instances?.filter(i => 
        i.connection_status === 'disconnected' || i.connection_status === 'error'
      ).length || 0;
      const orphaned = instances?.filter(i => !i.created_by_user_id).length || 0;

      setStats({ total, connected, disconnected, orphaned });
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGlobalCleanup = async () => {
    try {
      setIsLoading(true);
      toast.info('Iniciando limpeza global...');
      
      // Buscar instâncias órfãs ou com problemas
      const { data: problematicInstances, error } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name')
        .or('created_by_user_id.is.null,connection_status.eq.error');

      if (error) throw error;

      if (problematicInstances && problematicInstances.length > 0) {
        // Remover instâncias problemáticas
        const { error: deleteError } = await supabase
          .from('whatsapp_instances')
          .delete()
          .in('id', problematicInstances.map(i => i.id));

        if (deleteError) throw deleteError;

        toast.success(`${problematicInstances.length} instâncias problemáticas removidas`);
      } else {
        toast.info('Nenhuma instância problemática encontrada');
      }

      await fetchStats();
      
    } catch (error) {
      console.error('Erro na limpeza global:', error);
      toast.error('Erro durante a limpeza global');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    await fetchStats();
    toast.success('Estatísticas atualizadas');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estatísticas Globais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
              <div className="text-sm text-green-800">Conectadas</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.disconnected}</div>
              <div className="text-sm text-gray-800">Desconectadas</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.orphaned}</div>
              <div className="text-sm text-red-800">Órfãs</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleRefreshStats}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
            
            <Button 
              onClick={handleGlobalCleanup}
              disabled={isLoading}
              variant="destructive"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Limpeza Global
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats.orphaned > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {stats.orphaned} instância(s) órfã(s) detectada(s)
              </span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Instâncias sem vínculo de usuário podem causar problemas de segurança
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
