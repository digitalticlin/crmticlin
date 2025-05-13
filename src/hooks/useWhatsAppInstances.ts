
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { evolutionApiService, EvolutionInstance } from "@/services/evolutionApiService";
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

    const fetchInstances = async () => {
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
          const mappedInstances = data.map(instance => ({
            id: instance.id,
            instanceName: instance.instance_name,
            connected: instance.status === 'connected',
            qrCodeUrl: instance.qr_code
          }));
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

    fetchInstances();
  }, [userEmail, instanceName]);
  
  // Função para conectar uma nova instância WhatsApp
  const connectInstance = async (instanceId: string) => {
    setIsLoading(prev => ({...prev, [instanceId]: true}));
    
    try {
      // Obter a instância que queremos conectar
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) throw new Error("Instância não encontrada");
      
      // Criar a instância na API Evolution
      const result = await evolutionApiService.createInstance(instance.instanceName);
      
      if (!result || !result.qrcode || !result.qrcode.base64) {
        throw new Error("Não foi possível gerar o QR Code");
      }
      
      const qrCodeUrl = result.qrcode.base64;
      
      // Salvar no Supabase
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
        
      if (data && data.length > 0) {
        // Atualizar o estado local com o QR code e ID do banco
        setInstances(prev => 
          prev.map(i => 
            i.instanceName === instance.instanceName
              ? {
                  id: data[0].id,
                  instanceName: data[0].instance_name,
                  connected: false,
                  qrCodeUrl
                } 
              : i
          )
        );
      }
      
      toast.success("QR Code gerado com sucesso!");
      return qrCodeUrl;
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conectar WhatsApp. Tente novamente.");
      throw error;
    } finally {
      setIsLoading(prev => ({...prev, [instanceId]: false}));
    }
  };
  
  // Função para deletar uma instância WhatsApp
  const deleteInstance = async (instanceId: string) => {
    setIsLoading(prev => ({...prev, [instanceId]: true}));
    
    try {
      // Encontrar a instância no estado local
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) throw new Error("Instância não encontrada");
      
      // Deletar na API Evolution
      const success = await evolutionApiService.deleteInstance(instance.instanceName);
      
      if (!success) throw new Error("Falha ao remover instância na API");
      
      // Atualizar no Supabase
      if (instanceId !== "1") { // Se não for o ID placeholder
        const { error } = await supabase
          .from('whatsapp_numbers')
          .update({
            status: 'disconnected',
            date_disconnected: new Date().toISOString(),
            qr_code: null
          })
          .eq('id', instanceId);
          
        if (error) throw error;
      }
      
      setInstances(prev => 
        prev.map(i => 
          i.id === instanceId 
            ? {...i, connected: false, qrCodeUrl: undefined} 
            : i
        )
      );
      
      toast.success("WhatsApp desconectado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao desconectar WhatsApp. Tente novamente.");
      throw error;
    } finally {
      setIsLoading(prev => ({...prev, [instanceId]: false}));
    }
  };
  
  // Função para atualizar o QR Code de uma instância
  const refreshQrCode = async (instanceId: string) => {
    setIsLoading(prev => ({...prev, [instanceId]: true}));
    
    try {
      // Encontrar a instância no estado local
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) throw new Error("Instância não encontrada");
      
      // Obter novo QR Code da API Evolution
      const qrCodeUrl = await evolutionApiService.refreshQrCode(instance.instanceName);
      
      if (!qrCodeUrl) throw new Error("Não foi possível obter um novo QR Code");
      
      // Atualizar no Supabase
      if (instanceId !== "1") { // Se não for o ID placeholder
        const { error } = await supabase
          .from('whatsapp_numbers')
          .update({ qr_code: qrCodeUrl })
          .eq('id', instanceId);
          
        if (error) throw error;
      }
      
      setInstances(prev => 
        prev.map(i => 
          i.id === instanceId 
            ? {...i, qrCodeUrl} 
            : i
        )
      );
      
      toast.success("QR Code atualizado com sucesso!");
      return qrCodeUrl;
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar QR Code. Tente novamente.");
      throw error;
    } finally {
      setIsLoading(prev => ({...prev, [instanceId]: false}));
    }
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
