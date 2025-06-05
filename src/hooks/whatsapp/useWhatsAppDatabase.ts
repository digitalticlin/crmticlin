
import { useStabilizedInstanceSync } from './useStabilizedInstanceSync';

// FASE 1: Hook principal atualizado para usar sync estabilizado
export const useWhatsAppDatabase = () => {
  const { 
    instances, 
    isLoading, 
    error, 
    refetch,
    healthScore,
    isHealthy
  } = useStabilizedInstanceSync();

  const getActiveInstance = () => {
    // Priorizar instâncias conectadas e com telefone
    const connectedInstances = instances.filter(i => 
      ['open', 'ready'].includes(i.connection_status) && 
      i.phone &&
      i.vps_instance_id // Não é órfã
    );

    if (connectedInstances.length > 0) {
      return connectedInstances[0];
    }

    // Fallback para qualquer instância com telefone
    const instancesWithPhone = instances.filter(i => i.phone);
    return instancesWithPhone.length > 0 ? instancesWithPhone[0] : null;
  };

  return {
    instances,
    isLoading,
    error,
    refetch,
    getActiveInstance,
    healthScore,
    isHealthy,
    totalInstances: instances.length,
    connectedInstances: instances.filter(i => ['open', 'ready'].includes(i.connection_status)).length
  };
};
