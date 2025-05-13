
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppInstanceState, WhatsAppInstance } from './whatsappInstanceStore';
import { useWhatsAppConnector } from './useWhatsAppConnector';
import { useWhatsAppDisconnector } from './useWhatsAppDisconnector';
import { useCompanyResolver } from './useCompanyResolver';
import { evolutionApiService } from '@/services/evolution-api';

export const useWhatsAppInstances = (userEmail: string) => {
  const { instances, setInstances } = useWhatsAppInstanceState();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string>("");
  const [lastError, setLastError] = useState<string | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Resolvers
  const companyId = useCompanyResolver(userEmail);
  const { connectInstance, refreshQrCode } = useWhatsAppConnector();
  const { deleteInstance } = useWhatsAppDisconnector();
  
  // Carregar instâncias do WhatsApp
  useEffect(() => {
    const fetchWhatsAppInstances = async () => {
      if (!companyId) return;
      
      try {
        setIsLoading(prev => ({ ...prev, fetch: true }));
        
        // Buscar números de WhatsApp da empresa
        const { data: whatsappNumbers, error } = await supabase
          .from('whatsapp_numbers')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Erro ao buscar números de WhatsApp:", error);
          toast.error("Não foi possível carregar os números de WhatsApp");
          return;
        }
        
        // Converter para o formato de instância
        const fetchedInstances: WhatsAppInstance[] = whatsappNumbers.map(item => ({
          id: item.id,
          instanceName: item.instance_name,
          connected: item.status === 'connected',
          qrCodeUrl: item.qr_code || undefined,
          phoneNumber: item.phone || undefined,
        }));
        
        setInstances(fetchedInstances);
      } catch (error) {
        console.error("Erro ao buscar instâncias de WhatsApp:", error);
        toast.error("Ocorreu um erro ao carregar as instâncias de WhatsApp");
      } finally {
        setIsLoading(prev => ({ ...prev, fetch: false }));
      }
    };
    
    fetchWhatsAppInstances();
  }, [companyId, setInstances]);

  // Verificar o status da instância e atualizar no banco de dados
  const checkInstanceStatus = async (instanceId: string) => {
    try {
      const instance = instances.find(i => i.id === instanceId);
      if (!instance || !instance.instanceName) return;
      
      console.log(`Verificando status da instância: ${instance.instanceName}`);
      setIsLoading(prev => ({ ...prev, [instanceId]: true }));
      
      // Obter status atual da instância via Evolution API
      const status = await evolutionApiService.checkInstanceStatus(instance.instanceName);
      console.log(`Status da instância ${instance.instanceName}: ${status}`);
      
      // Atualizar status no banco de dados
      if (instanceId !== "1") {
        const { error } = await supabase
          .from('whatsapp_numbers')
          .update({ status })
          .eq('id', instanceId);
          
        if (error) {
          console.error("Erro ao atualizar status no banco:", error);
        }
      }
      
      // Atualizar estado local
      const updatedInstances = instances.map(i => {
        if (i.id === instanceId) {
          return { 
            ...i, 
            connected: status === 'connected'
          };
        }
        return i;
      });
      
      setInstances(updatedInstances);
      
      return status;
    } catch (error) {
      console.error(`Erro ao verificar status da instância ${instanceId}:`, error);
      return "disconnected";
    } finally {
      setIsLoading(prev => ({ ...prev, [instanceId]: false }));
    }
  };
  
  // Função para adicionar nova instância
  const addNewInstance = async (username: string) => {
    if (!username.trim()) {
      toast.error("Nome de usuário não pode estar vazio");
      return;
    }
    
    if (!companyId) {
      toast.error("Nenhuma empresa associada ao usuário");
      return;
    }
    
    try {
      // Criar nova instância local
      const newInstanceId = crypto.randomUUID();
      const newInstance: WhatsAppInstance = {
        id: newInstanceId,
        instanceName: username.trim(),
        connected: false,
      };
      
      // Adicionar ao estado local
      setInstances([newInstance, ...instances]);
      
      // Conectar a instância - isso verifica se já existe uma instância com o mesmo nome
      // e irá adicionar um número sequencial se necessário
      const qrCodeUrl = await connectInstance(newInstance);
      
      // Retorna a instância com o QR Code
      return {
        ...newInstance,
        qrCodeUrl
      };
    } catch (error) {
      console.error("Erro ao adicionar nova instância:", error);
      toast.error("Não foi possível adicionar a nova instância");
      setLastError("Erro ao adicionar nova instância");
      throw error;
    }
  };
  
  return {
    instances,
    isLoading,
    instanceName,
    setInstanceName,
    showQrCode,
    setShowQrCode,
    lastError,
    setLastError,
    
    // Funções
    checkInstanceStatus,
    connectInstance: async (instanceId: string | WhatsAppInstance) => {
      try {
        // Verificar se instanceId é uma string ou um objeto WhatsAppInstance
        const instanceToConnect = typeof instanceId === 'string' 
          ? instances.find(i => i.id === instanceId) 
          : instanceId;
          
        if (!instanceToConnect) {
          throw new Error("Instância não encontrada");
        }
        
        setIsLoading(prev => ({ ...prev, [instanceToConnect.id]: true }));
        setLastError(null);
        
        const qrCodeUrl = await connectInstance(instanceToConnect);
        setShowQrCode(instanceToConnect.id);
        return qrCodeUrl;
      } catch (error: any) {
        console.error("Erro ao conectar instância:", error);
        setLastError(error?.message || "Erro ao conectar instância WhatsApp");
      } finally {
        if (typeof instanceId === 'string') {
          setIsLoading(prev => ({ ...prev, [instanceId]: false }));
        } else {
          setIsLoading(prev => ({ ...prev, [instanceId.id]: false }));
        }
      }
    },
    
    refreshQrCode: async (instanceId: string) => {
      try {
        setIsLoading(prev => ({ ...prev, [instanceId]: true }));
        setLastError(null);
        
        const instance = instances.find(i => i.id === instanceId);
        if (!instance) {
          throw new Error("Instância não encontrada");
        }
        
        // Usando o connectInstance em vez de refreshQrCode para obter um código completamente novo
        await connectInstance(instance);
        setShowQrCode(instanceId);
      } catch (error: any) {
        console.error("Erro ao atualizar QR code:", error);
        setLastError(error?.message || "Erro ao atualizar QR code");
      } finally {
        setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      }
    },
    
    deleteInstance: async (instanceId: string) => {
      try {
        setIsLoading(prev => ({ ...prev, [instanceId]: true }));
        setLastError(null);
        
        const instance = instances.find(i => i.id === instanceId);
        if (!instance) {
          throw new Error("Instância não encontrada");
        }
        
        await deleteInstance(instance);
        
        // Remover do estado local após sucesso
        setInstances(instances.filter(i => i.id !== instanceId));
        toast.success("WhatsApp desconectado com sucesso!");
      } catch (error: any) {
        console.error("Erro ao deletar instância:", error);
        setLastError(error?.message || "Erro ao deletar instância WhatsApp");
      } finally {
        setIsLoading(prev => ({ ...prev, [instanceId]: false }));
      }
    },
    
    addNewInstance
  };
};
