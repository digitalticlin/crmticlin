
import { useState } from "react";
import { useGlobalVPSInstances } from "@/hooks/admin/useGlobalVPSInstances";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrphanManagerHeader } from "./orphan/OrphanManagerHeader";
import { OrphanStatistics } from "./orphan/OrphanStatistics";
import { OrphanControls } from "./orphan/OrphanControls";
import { OrphanInstancesList } from "./orphan/OrphanInstancesList";

export const OrphanInstanceManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    instances,
    isLoading,
    refreshInstances,
    cleanupOrphans
  } = useGlobalVPSInstances();

  // Filtrar apenas instâncias órfãs
  const orphanInstances = instances.filter(instance => instance.isOrphan);
  
  // Aplicar filtro de busca
  const filteredOrphans = orphanInstances.filter(instance => 
    instance.instanceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instance.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instance.profileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sincronizar instâncias órfãs que têm telefone
  const handleSyncOrphans = async () => {
    if (!confirm('Sincronizar todas as instâncias órfãs que possuem telefone ativo?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'sync_orphan_instances' }
      });

      if (error) {
        toast.error('Erro ao sincronizar órfãs');
        return;
      }

      if (data.success) {
        toast.success(`${data.syncedOrphans || 0} instâncias órfãs sincronizadas`);
        await refreshInstances();
      } else {
        toast.error('Falha na sincronização: ' + data.error);
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar órfãs:', error);
      toast.error('Erro inesperado na sincronização');
    } finally {
      setIsProcessing(false);
    }
  };

  // Vincular instância órfã a um usuário específico
  const handleBindInstance = async (instanceId: string) => {
    const userEmail = prompt('Digite o email do usuário para vincular esta instância:');
    if (!userEmail) return;

    const instanceName = prompt('Digite um nome para esta instância:') || `instance_${instanceId.slice(-8)}`;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { 
          action: 'bind_instance_to_user',
          instanceId,
          userEmail,
          instanceName
        }
      });

      if (error) {
        toast.error('Erro ao vincular instância');
        return;
      }

      if (data.success) {
        toast.success(`Instância vinculada ao usuário ${userEmail}`);
        await refreshInstances();
      } else {
        toast.error('Falha na vinculação: ' + data.error);
      }
    } catch (error: any) {
      console.error('Erro ao vincular instância:', error);
      toast.error('Erro inesperado na vinculação');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <OrphanManagerHeader 
        onRefresh={refreshInstances}
        isLoading={isLoading}
      />

      <OrphanStatistics orphanInstances={orphanInstances} />

      <OrphanControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSyncOrphans={handleSyncOrphans}
        onCleanupOrphans={cleanupOrphans}
        isProcessing={isProcessing}
        orphanInstances={orphanInstances}
      />

      <OrphanInstancesList
        filteredOrphans={filteredOrphans}
        orphanInstances={orphanInstances}
        isLoading={isLoading}
        isProcessing={isProcessing}
        onBindInstance={handleBindInstance}
      />
    </div>
  );
};
