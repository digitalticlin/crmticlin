
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useWhatsAppInstanceState, WhatsAppInstance } from './whatsappInstanceStore';
import { useWhatsAppConnector } from './useWhatsAppConnector';
import { useWhatsAppDisconnector } from './useWhatsAppDisconnector';
import { useCompanyResolver } from './useCompanyResolver';

export const useWhatsAppInstances = (userEmail: string) => {
  const { instances, setInstances } = useWhatsAppInstanceState();
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string>("");
  const [lastError, setLastError] = useState<string | null>(null);
  
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
  
  // Função para adicionar nova instância
  const addNewInstance = async () => {
    if (!instanceName.trim()) {
      toast.error("Nome da instância não pode estar vazio");
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
        instanceName,
        connected: false,
      };
      
      // Adicionar ao estado local
      setInstances([newInstance, ...instances]);
      
      // Limpar o campo de nome
      setInstanceName("");
      
      // Conectar a instância
      await connectInstance(newInstance);
    } catch (error) {
      console.error("Erro ao adicionar nova instância:", error);
      toast.error("Não foi possível adicionar a nova instância");
      setLastError("Erro ao adicionar nova instância");
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
    connectInstance: async (instanceId: string) => {
      try {
        setIsLoading(prev => ({ ...prev, [instanceId]: true }));
        setLastError(null);
        
        const instance = instances.find(i => i.id === instanceId);
        if (!instance) {
          throw new Error("Instância não encontrada");
        }
        
        await connectInstance(instance);
        setShowQrCode(instanceId);
      } catch (error: any) {
        console.error("Erro ao conectar instância:", error);
        setLastError(error?.message || "Erro ao conectar instância WhatsApp");
      } finally {
        setIsLoading(prev => ({ ...prev, [instanceId]: false }));
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
        
        await refreshQrCode(instance);
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
        toast.success("WhatsApp desconectado com sucesso");
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
