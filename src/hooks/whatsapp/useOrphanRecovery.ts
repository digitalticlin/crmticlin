
import { useState, useCallback } from 'react';
import { OrphanInstanceRecoveryService, OrphanInstance } from '@/services/whatsapp/orphanInstanceRecoveryService';
import { useCompanyData } from '@/hooks/useCompanyData';
import { toast } from 'sonner';

export const useOrphanRecovery = () => {
  const [orphans, setOrphans] = useState<OrphanInstance[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [healthCheck, setHealthCheck] = useState<any>(null);
  
  const { companyId } = useCompanyData();

  const scanForOrphans = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsScanning(true);
      console.log('[Orphan Hook] 🔍 Escaneando órfãs...');
      
      const foundOrphans = await OrphanInstanceRecoveryService.findOrphanInstances(companyId);
      setOrphans(foundOrphans);
      
      if (foundOrphans.length > 0) {
        toast.info(`${foundOrphans.length} instância(s) órfã(s) encontrada(s)`);
      } else {
        toast.success('Nenhuma instância órfã encontrada');
      }
    } catch (error) {
      console.error('[Orphan Hook] ❌ Erro no scan:', error);
      toast.error('Erro ao escanear órfãs');
    } finally {
      setIsScanning(false);
    }
  }, [companyId]);

  const adoptOrphan = useCallback(async (orphan: OrphanInstance, instanceName: string) => {
    if (!companyId) return { success: false, error: 'Company ID não encontrado' };

    try {
      setIsAdopting(true);
      console.log('[Orphan Hook] 🤝 Adotando órfã:', orphan.instanceId);
      
      const result = await OrphanInstanceRecoveryService.adoptOrphanInstance(
        orphan, 
        companyId, 
        instanceName
      );
      
      if (result.success) {
        toast.success(`Instância "${instanceName}" adotada com sucesso!`);
        // Remover da lista de órfãs
        setOrphans(prev => prev.filter(o => o.instanceId !== orphan.instanceId));
      } else {
        toast.error(`Erro ao adotar: ${result.error}`);
      }
      
      return result;
    } catch (error: any) {
      console.error('[Orphan Hook] ❌ Erro ao adotar:', error);
      toast.error(`Erro ao adotar órfã: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsAdopting(false);
    }
  }, [companyId]);

  const performHealthCheck = useCallback(async () => {
    if (!companyId) return;

    try {
      console.log('[Orphan Hook] 🏥 Executando health check...');
      
      const result = await OrphanInstanceRecoveryService.performHealthCheck(companyId);
      setHealthCheck(result);
      setOrphans(result.orphans);
      
      if (result.recommendations.length > 0) {
        result.recommendations.forEach(rec => {
          toast.info(rec, { duration: 5000 });
        });
      }
    } catch (error) {
      console.error('[Orphan Hook] ❌ Erro no health check:', error);
      toast.error('Erro no health check');
    }
  }, [companyId]);

  return {
    orphans,
    isScanning,
    isAdopting,
    healthCheck,
    scanForOrphans,
    adoptOrphan,
    performHealthCheck
  };
};
