
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
        console.error('[Sync Orphans] Erro na edge function:', error);
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
      console.error('[Sync Orphans] Erro inesperado:', error);
      toast.error('Erro inesperado na sincronização');
    } finally {
      setIsProcessing(false);
    }
  };

  // CORREÇÃO: Vincular instância órfã a um usuário específico com formato correto
  const handleBindInstance = async (instanceId: string) => {
    const userEmail = prompt('Digite o email do usuário para vincular esta instância:');
    if (!userEmail) {
      console.log('[Bind Instance] Operação cancelada pelo usuário');
      return;
    }

    console.log('[Bind Instance] 🔗 Iniciando vinculação:', { instanceId, userEmail });
    
    setIsProcessing(true);
    try {
      // CORREÇÃO CRÍTICA: Usar o formato correto esperado pela edge function
      const requestBody = {
        action: 'bind_instance_to_user',
        instanceData: {
          instanceId: instanceId.trim(),
          userEmail: userEmail.trim()
        }
      };

      console.log('[Bind Instance] 📤 Enviando requisição:', requestBody);

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: requestBody
      });

      if (error) {
        console.error('[Bind Instance] ❌ Erro na edge function:', error);
        toast.error(`Erro ao vincular instância: ${error.message}`);
        return;
      }

      console.log('[Bind Instance] 📥 Resposta recebida:', data);

      if (data && data.success) {
        toast.success(`Instância vinculada com sucesso ao usuário ${data.user?.name || userEmail}!`);
        await refreshInstances();
      } else {
        const errorMessage = data?.error || 'Erro desconhecido na vinculação';
        console.error('[Bind Instance] ❌ Falha na vinculação:', errorMessage);
        toast.error(`Falha na vinculação: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('[Bind Instance] 💥 Erro inesperado:', error);
      toast.error(`Erro inesperado na vinculação: ${error.message}`);
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
