import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Monitor, 
  Phone, 
  User, 
  Building2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { VPSInstanceCorrection } from './VPSInstanceCorrection';

interface VPSInstance {
  instanceId: string;
  status: string;
  phone?: string;
  profileName?: string;
  isOrphan: boolean;
  companyName?: string;
  userName?: string;
}

export const VPSInstancesSimplified = () => {
  const [instances, setInstances] = useState<VPSInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadInstances = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'list_all_instances_global' }
      });

      if (error) throw error;

      if (data.success) {
        setInstances(data.instances || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar instâncias:', error);
      toast.error('Erro ao carregar instâncias VPS');
    } finally {
      setIsLoading(false);
    }
  };

  const syncOrphanInstances = async () => {
    if (!confirm('Sincronizar todas as instâncias órfãs que possuem telefone para o Supabase?')) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('[VPS Instances Simplified] 🔄 Iniciando sincronização de órfãs...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { 
          action: 'sync_orphan_instances'
        }
      });

      if (error) {
        console.error('[VPS Instances Simplified] ❌ Erro na edge function:', error);
        throw error;
      }

      console.log('[VPS Instances Simplified] ✅ Resposta da sincronização:', data);

      if (data.success) {
        toast.success(`Sincronização concluída! ${data.syncedOrphans} órfãs sincronizadas`);
        if (data.errors && data.errors.length > 0) {
          toast.warning(`${data.errors.length} erros durante a sincronização`);
        }
        loadInstances();
      } else {
        toast.error('Falha na sincronização: ' + data.error);
      }
    } catch (error: any) {
      console.error('[VPS Instances Simplified] 💥 Erro inesperado:', error);
      toast.error('Erro ao sincronizar órfãs: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  const stats = {
    total: instances.length,
    active: instances.filter(i => i.status === 'open').length,
    orphaned: instances.filter(i => i.isOrphan).length
  };

  const getStatusIcon = (status: string, isOrphan: boolean) => {
    if (isOrphan) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (status === 'open') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (status: string, isOrphan: boolean) => {
    if (isOrphan) return 'Órfã';
    if (status === 'open') return 'Ativa';
    return 'Inativa';
  };

  return (
    <div className="space-y-6">
      {/* Resumo Simplificado */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Ativas</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.orphaned}</div>
              <div className="text-sm text-muted-foreground">Órfãs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Correção Manual - NOVO */}
      <VPSInstanceCorrection />

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Ações de Sincronização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={loadInstances}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
            
            <Button 
              onClick={syncOrphanInstances}
              disabled={isLoading}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar Órfãs
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            A sincronização irá adicionar no Supabase todas as instâncias órfãs que possuem número de telefone para facilitar o gerenciamento.
          </p>
        </CardContent>
      </Card>

      {/* Lista Simplificada de Instâncias */}
      <Card>
        <CardHeader>
          <CardTitle>Instâncias WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {instances.map((instance) => (
              <div 
                key={instance.instanceId} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(instance.status, instance.isOrphan)}
                    <span className="font-mono text-sm">
                      {instance.instanceId.slice(-8)}
                    </span>
                  </div>
                  
                  {instance.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {instance.phone}
                    </div>
                  )}
                  
                  {instance.profileName && (
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3" />
                      {instance.profileName}
                    </div>
                  )}
                  
                  {instance.companyName && (
                    <div className="flex items-center gap-1 text-sm">
                      <Building2 className="h-3 w-3" />
                      {instance.companyName}
                    </div>
                  )}
                </div>
                
                <Badge variant={instance.isOrphan ? "destructive" : instance.status === 'open' ? "default" : "secondary"}>
                  {getStatusText(instance.status, instance.isOrphan)}
                </Badge>
              </div>
            ))}
            
            {instances.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma instância encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
