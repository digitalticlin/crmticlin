
import { useState, useCallback } from 'react';
import { InstanceCreationProtectionService } from '@/services/whatsapp/instanceCreationProtectionService';
import { useCompanyData } from '@/hooks/useCompanyData';
import { toast } from 'sonner';

export const useProtectedInstanceCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  
  const { companyId } = useCompanyData();

  const createInstanceProtected = useCallback(async (instanceName: string) => {
    if (!companyId) {
      toast.error('Company ID não encontrado');
      return { success: false, error: 'Company ID não encontrado' };
    }

    try {
      setIsCreating(true);
      setCreationProgress('Iniciando criação blindada...');
      
      const result = await InstanceCreationProtectionService.createInstanceWithProtection(
        instanceName,
        companyId
      );
      
      if (result.success) {
        setCreationProgress('Instância criada com sucesso!');
        toast.success(`Instância "${instanceName}" criada com proteção ativa!`);
        
        if (result.retries && result.retries > 0) {
          toast.info(`Sucesso após ${result.retries} tentativas de retry`);
        }
      } else {
        setCreationProgress(`Falha: ${result.error}`);
        toast.error(`Erro protegido: ${result.error}`);
      }
      
      return result;
    } catch (error: any) {
      const errorMsg = `Erro na criação protegida: ${error.message}`;
      setCreationProgress(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
      setTimeout(() => setCreationProgress(''), 3000);
    }
  }, [companyId]);

  const getQRCodeProtected = useCallback(async (instanceId: string) => {
    try {
      setCreationProgress('Obtendo QR Code blindado...');
      
      const result = await InstanceCreationProtectionService.getQRCodeWithProtection(instanceId);
      
      if (result.success) {
        setCreationProgress('QR Code obtido com sucesso!');
        toast.success('QR Code protegido obtido!');
      } else {
        setCreationProgress(`Falha no QR: ${result.error}`);
        toast.error(`Erro no QR protegido: ${result.error}`);
      }
      
      return result;
    } catch (error: any) {
      const errorMsg = `Erro no QR protegido: ${error.message}`;
      setCreationProgress(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: error.message };
    } finally {
      setTimeout(() => setCreationProgress(''), 3000);
    }
  }, []);

  const performHealthCheck = useCallback(async () => {
    if (!companyId) return;

    try {
      setCreationProgress('Executando health check...');
      
      const result = await InstanceCreationProtectionService.performInstanceHealthCheck(companyId);
      setHealthStatus(result);
      
      setCreationProgress('Health check concluído');
      
      if (result.errors > 0) {
        toast.warning(`Health check: ${result.errors} erro(s), ${result.warnings} aviso(s)`);
      } else {
        toast.success(`Health check: ${result.healthy} instância(s) saudável(eis)`);
      }
    } catch (error: any) {
      setCreationProgress(`Erro no health check: ${error.message}`);
      toast.error('Erro no health check protegido');
    } finally {
      setTimeout(() => setCreationProgress(''), 3000);
    }
  }, [companyId]);

  return {
    isCreating,
    creationProgress,
    healthStatus,
    createInstanceProtected,
    getQRCodeProtected,
    performHealthCheck
  };
};
