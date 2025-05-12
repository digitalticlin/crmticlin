
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
  
  // Simula o carregamento inicial das instâncias do usuário
  useEffect(() => {
    if (userEmail) {
      // Na implementação real, isso seria uma chamada à API
      // fetchUserInstances(instanceName).then(data => setInstances(data));
      
      // Simulação para fins de demonstração
      setInstances([
        { id: "1", instanceName, connected: false }
      ]);
    }
  }, [userEmail, instanceName]);
  
  // Função para conectar uma nova instância WhatsApp
  const connectInstance = async (instanceId: string) => {
    setIsLoading(prev => ({...prev, [instanceId]: true}));
    
    try {
      // Aqui seria a chamada real à API da Evolution
      // const response = await fetch('https://api.evolution.com/create-instance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ instanceName })
      // });
      // const data = await response.json();
      
      // Simulação de resposta
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockQrCodeUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
      
      setInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? {...instance, qrCodeUrl: mockQrCodeUrl} 
            : instance
        )
      );
      
      toast.success("QR Code gerado com sucesso!");
      return mockQrCodeUrl;
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
      // Aqui seria a chamada real à API da Evolution
      // const response = await fetch(`https://api.evolution.com/delete-instance/${instanceName}`, {
      //   method: 'DELETE'
      // });
      
      // Simulação de resposta
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? {...instance, connected: false, qrCodeUrl: undefined} 
            : instance
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
      // Aqui seria a chamada real à API da Evolution
      // const response = await fetch(`https://api.evolution.com/refresh-qr/${instanceName}`, {
      //   method: 'GET'
      // });
      // const data = await response.json();
      
      // Simulação de resposta
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockQrCodeUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
      
      setInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? {...instance, qrCodeUrl: mockQrCodeUrl} 
            : instance
        )
      );
      
      toast.success("QR Code atualizado com sucesso!");
      return mockQrCodeUrl;
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
