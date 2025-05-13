
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { evolutionApiService } from "@/services/evolutionApiService";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppInstance {
  id: string;
  instanceName: string;
  connected: boolean;
  qrCodeUrl?: string;
}

export const useWhatsAppInstances = (userEmail: string) => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  
  // Gerar nome de instância com base no email (parte antes do @)
  const instanceName = userEmail ? userEmail.split('@')[0] : "";
  
  // Carrega as instâncias do usuário do Supabase
  useEffect(() => {
    if (!userEmail) return;
    fetchUserInstances();
  }, [userEmail, instanceName]);
  
  const fetchUserInstances = async () => {
    try {
      // Buscar instâncias do usuário atual do Supabase
      const { data, error } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('instance_name', instanceName);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const mappedInstances = mapDatabaseInstancesToState(data);
        setInstances(mappedInstances);
      } else {
        // Se não encontrar nenhuma instância, cria um placeholder
        setInstances([
          { id: "1", instanceName, connected: false }
        ]);
      }
    } catch (error) {
      console.error("Erro ao buscar instâncias:", error);
      toast.error("Erro ao carregar instâncias WhatsApp");
      setInstances([
        { id: "1", instanceName, connected: false }
      ]);
    }
  };

  // Mapeia os dados do banco para o formato de estado da aplicação
  const mapDatabaseInstancesToState = (data: any[]): WhatsAppInstance[] => {
    return data.map(instance => ({
      id: instance.id,
      instanceName: instance.instance_name,
      connected: instance.status === 'connected',
      qrCodeUrl: instance.qr_code
    }));
  };
  
  // Função para conectar uma nova instância WhatsApp
  const connectInstance = async (instanceId: string) => {
    setLoadingState(instanceId, true);
    
    try {
      // Obter a instância que queremos conectar
      const instance = findInstanceById(instanceId);
      if (!instance) throw new Error("Instância não encontrada");
      
      // Criar a instância na API Evolution
      const result = await evolutionApiService.createInstance(instance.instanceName);
      
      if (!result || !result.qrcode || !result.qrcode.base64) {
        throw new Error("Não foi possível gerar o QR Code");
      }
      
      const qrCodeUrl = result.qrcode.base64;
      
      // Salvar no Supabase
      const updatedInstance = await saveInstanceToDatabase(instance, qrCodeUrl, result);
      
      // Atualizar o estado local
      updateLocalInstanceState(instance, updatedInstance, qrCodeUrl);
      
      toast.success("QR Code gerado com sucesso!");
      return qrCodeUrl;
    } catch (error) {
      handleOperationError(error, "conectar WhatsApp");
      throw error;
    } finally {
      setLoadingState(instanceId, false);
    }
  };

  // Função auxiliar para encontrar uma instância pelo ID
  const findInstanceById = (instanceId: string): WhatsAppInstance | undefined => {
    return instances.find(i => i.id === instanceId);
  };

  // Função para salvar a instância no banco de dados
  const saveInstanceToDatabase = async (instance: WhatsAppInstance, qrCodeUrl: string, result: any) => {
    const { error } = await supabase
      .from('whatsapp_numbers')
      .upsert({
        id: instance.id === "1" ? undefined : instance.id, // Se for um novo registro, deixe o Supabase gerar o ID
        instance_name: instance.instanceName,
        phone: "", // Será atualizado quando conectar
        company_id: "your_company_id", // Substitua pelo ID da empresa do usuário
        status: "connecting",
        qr_code: qrCodeUrl,
        instance_id: result.instanceId,
        evolution_instance_name: result.instanceName
      });

    if (error) throw error;
    
    // Buscar o registro inserido/atualizado para obter o ID gerado
    const { data } = await supabase
      .from('whatsapp_numbers')
      .select('*')
      .eq('instance_name', instance.instanceName)
      .limit(1);
      
    if (!data || data.length === 0) {
      throw new Error("Erro ao recuperar instância após salvar");
    }
    
    return data[0];
  };

  // Atualiza o estado local da instância
  const updateLocalInstanceState = (oldInstance: WhatsAppInstance, databaseInstance: any, qrCodeUrl: string) => {
    setInstances(prev => 
      prev.map(i => 
        i.instanceName === oldInstance.instanceName
          ? {
              id: databaseInstance.id,
              instanceName: databaseInstance.instance_name,
              connected: false,
              qrCodeUrl
            } 
          : i
      )
    );
  };

  // Define o estado de carregamento para uma instância específica
  const setLoadingState = (instanceId: string, isLoadingState: boolean) => {
    setIsLoading(prev => ({...prev, [instanceId]: isLoadingState}));
  };
  
  // Função para deletar uma instância WhatsApp
  const deleteInstance = async (instanceId: string) => {
    setLoadingState(instanceId, true);
    
    try {
      // Encontrar a instância no estado local
      const instance = findInstanceById(instanceId);
      if (!instance) throw new Error("Instância não encontrada");
      
      // Deletar na API Evolution
      const success = await evolutionApiService.deleteInstance(instance.instanceName);
      
      if (!success) throw new Error("Falha ao remover instância na API");
      
      // Atualizar no Supabase
      await updateInstanceDisconnectedStatus(instanceId);
      
      // Atualizar estado local
      updateInstanceLocalState(instanceId, false);
      
      toast.success("WhatsApp desconectado com sucesso!");
    } catch (error) {
      handleOperationError(error, "desconectar WhatsApp");
      throw error;
    } finally {
      setLoadingState(instanceId, false);
    }
  };

  // Atualiza o status da instância para desconectado no banco
  const updateInstanceDisconnectedStatus = async (instanceId: string) => {
    if (instanceId === "1") return; // Se for o ID placeholder, não precisa atualizar no banco
    
    const { error } = await supabase
      .from('whatsapp_numbers')
      .update({
        status: 'disconnected',
        date_disconnected: new Date().toISOString(),
        qr_code: null
      })
      .eq('id', instanceId);
      
    if (error) throw error;
  };

  // Atualiza o estado local de uma instância
  const updateInstanceLocalState = (instanceId: string, connected: boolean, qrCodeUrl?: string) => {
    setInstances(prev => 
      prev.map(i => 
        i.id === instanceId 
          ? {...i, connected, qrCodeUrl} 
          : i
      )
    );
  };
  
  // Função para atualizar o QR Code de uma instância
  const refreshQrCode = async (instanceId: string) => {
    setLoadingState(instanceId, true);
    
    try {
      // Encontrar a instância no estado local
      const instance = findInstanceById(instanceId);
      if (!instance) throw new Error("Instância não encontrada");
      
      // Obter novo QR Code da API Evolution
      const qrCodeUrl = await evolutionApiService.refreshQrCode(instance.instanceName);
      
      if (!qrCodeUrl) throw new Error("Não foi possível obter um novo QR Code");
      
      // Atualizar no Supabase
      await updateQrCodeInDatabase(instanceId, qrCodeUrl);
      
      // Atualizar estado local
      updateInstanceLocalState(instanceId, false, qrCodeUrl);
      
      toast.success("QR Code atualizado com sucesso!");
      return qrCodeUrl;
    } catch (error) {
      handleOperationError(error, "atualizar QR Code");
      throw error;
    } finally {
      setLoadingState(instanceId, false);
    }
  };

  // Atualiza o QR code no banco de dados
  const updateQrCodeInDatabase = async (instanceId: string, qrCodeUrl: string) => {
    if (instanceId === "1") return; // Se for o ID placeholder, não precisa atualizar no banco
    
    const { error } = await supabase
      .from('whatsapp_numbers')
      .update({ qr_code: qrCodeUrl })
      .eq('id', instanceId);
      
    if (error) throw error;
  };

  // Trata erros de operação e exibe toast para o usuário
  const handleOperationError = (error: any, operation: string) => {
    console.error(error);
    toast.error(`Erro ao ${operation}. Tente novamente.`);
  };
  
  return {
    instances,
    isLoading,
    instanceName,
    connectInstance,
    deleteInstance,
    refreshQrCode
  };
};
