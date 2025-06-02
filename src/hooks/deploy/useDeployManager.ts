
import { useState, useEffect } from 'react';
import { DeployService } from '@/services/deploy/deployService';
import { toast } from 'sonner';

interface DeployState {
  isDeployingTest: boolean;
  isDeployingProduction: boolean;
  testStatus: any;
  productionStatus: any;
  deployHistory: any[];
  isSettingUpInfrastructure: boolean;
}

export const useDeployManager = () => {
  const [state, setState] = useState<DeployState>({
    isDeployingTest: false,
    isDeployingProduction: false,
    testStatus: null,
    productionStatus: null,
    deployHistory: [],
    isSettingUpInfrastructure: false
  });

  // Carregar status inicial
  useEffect(() => {
    loadEnvironmentStatuses();
    loadDeployHistory();
  }, []);

  const loadEnvironmentStatuses = async () => {
    try {
      const [testStatus, productionStatus] = await Promise.all([
        DeployService.getEnvironmentStatus('test'),
        DeployService.getEnvironmentStatus('production')
      ]);
      
      setState(prev => ({
        ...prev,
        testStatus,
        productionStatus
      }));
    } catch (error) {
      console.error('Erro ao carregar status dos ambientes:', error);
    }
  };

  const loadDeployHistory = () => {
    const history = DeployService.getDeployHistory();
    setState(prev => ({ ...prev, deployHistory: history }));
  };

  const deployToTest = async (gitRepository: string) => {
    setState(prev => ({ ...prev, isDeployingTest: true }));
    toast.info('🚀 Iniciando deploy para TESTE...');
    
    try {
      const result = await DeployService.deployToEnvironment('test', gitRepository);
      
      if (result.success) {
        toast.success('✅ Deploy para TESTE concluído com sucesso!');
        toast.info(`🌐 Site disponível em: https://teste-crm.ticlin.com.br`);
      } else {
        toast.error(`❌ Erro no deploy para TESTE: ${result.error}`);
      }
      
      // Atualizar status e histórico
      await loadEnvironmentStatuses();
      loadDeployHistory();
      
      return result;
    } catch (error) {
      toast.error(`❌ Erro no deploy para TESTE: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setState(prev => ({ ...prev, isDeployingTest: false }));
    }
  };

  const deployToProduction = async (gitRepository: string) => {
    setState(prev => ({ ...prev, isDeployingProduction: true }));
    toast.info('🚀 Iniciando deploy para PRODUÇÃO...');
    
    try {
      const result = await DeployService.deployToEnvironment('production', gitRepository);
      
      if (result.success) {
        toast.success('✅ Deploy para PRODUÇÃO concluído com sucesso!');
        toast.info(`🌐 Site disponível em: https://crm.ticlin.com.br`);
      } else {
        toast.error(`❌ Erro no deploy para PRODUÇÃO: ${result.error}`);
      }
      
      // Atualizar status e histórico
      await loadEnvironmentStatuses();
      loadDeployHistory();
      
      return result;
    } catch (error) {
      toast.error(`❌ Erro no deploy para PRODUÇÃO: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setState(prev => ({ ...prev, isDeployingProduction: false }));
    }
  };

  const setupInfrastructure = async () => {
    setState(prev => ({ ...prev, isSettingUpInfrastructure: true }));
    toast.info('🏗️ Configurando infraestrutura na VPS...');
    
    try {
      const success = await DeployService.setupVPSInfrastructure();
      
      if (success) {
        toast.success('✅ Infraestrutura configurada com sucesso!');
      } else {
        toast.error('❌ Erro ao configurar infraestrutura');
      }
      
      return success;
    } catch (error) {
      toast.error(`❌ Erro: ${error.message}`);
      return false;
    } finally {
      setState(prev => ({ ...prev, isSettingUpInfrastructure: false }));
    }
  };

  const refreshStatuses = () => {
    loadEnvironmentStatuses();
    loadDeployHistory();
  };

  return {
    ...state,
    deployToTest,
    deployToProduction,
    setupInfrastructure,
    refreshStatuses
  };
};
