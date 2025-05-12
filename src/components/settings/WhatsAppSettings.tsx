
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Trash2, RefreshCw, Link } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface WhatsAppInstance {
  id: string;
  instanceName: string;
  connected: boolean;
  qrCodeUrl?: string;
}

const WhatsAppSettings = () => {
  // Estado para armazenar as instâncias de WhatsApp do usuário
  const [instances, setInstances] = useState<WhatsAppInstance[]>([
    // Dados de exemplo - na implementação real viriam do banco de dados
    { id: "1", instanceName: "digitalticlin", connected: false }
  ]);
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  
  // Função para gerar o nome da instância com base no email
  const getUsernameFromEmail = (email: string) => {
    return email.split('@')[0];
  };
  
  // Exemplo de email do usuário atual - na implementação real viria do contexto de autenticação
  const currentUserEmail = "digitalticlin@gmail.com";
  const instanceName = getUsernameFromEmail(currentUserEmail);

  // Simula a conexão de uma nova instância WhatsApp
  const handleConnect = async (instanceId: string) => {
    setIsLoading({...isLoading, [instanceId]: true});
    
    try {
      // Aqui seria a chamada real à API da Evolution para criar instância
      // const response = await fetch('https://api.evolution.com/create-instance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ instanceName })
      // });
      // const data = await response.json();
      
      // Simulação de resposta da API
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockQrCodeUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
      
      setInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? {...instance, qrCodeUrl: mockQrCodeUrl} 
            : instance
        )
      );
      
      setShowQrCode(instanceId);
      toast.success("QR Code gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao conectar WhatsApp. Tente novamente.");
      console.error(error);
    } finally {
      setIsLoading({...isLoading, [instanceId]: false});
    }
  };

  // Simula a desconexão/deleção de uma instância WhatsApp
  const handleDelete = async (instanceId: string) => {
    setIsLoading({...isLoading, [instanceId]: true});
    
    try {
      // Aqui seria a chamada real à API da Evolution para deletar instância
      // const response = await fetch(`https://api.evolution.com/delete-instance/${instanceName}`, {
      //   method: 'DELETE'
      // });
      
      // Simulação de resposta da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? {...instance, connected: false, qrCodeUrl: undefined} 
            : instance
        )
      );
      
      setShowQrCode(null);
      toast.success("WhatsApp desconectado com sucesso!");
    } catch (error) {
      toast.error("Erro ao desconectar WhatsApp. Tente novamente.");
      console.error(error);
    } finally {
      setIsLoading({...isLoading, [instanceId]: false});
    }
  };

  // Simula a geração de um novo QR Code para uma instância existente
  const handleRefreshQrCode = async (instanceId: string) => {
    setIsLoading({...isLoading, [instanceId]: true});
    
    try {
      // Aqui seria a chamada real à API da Evolution para gerar novo QR Code
      // const response = await fetch(`https://api.evolution.com/refresh-qr/${instanceName}`, {
      //   method: 'GET'
      // });
      // const data = await response.json();
      
      // Simulação de resposta da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockQrCodeUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";
      
      setInstances(prev => 
        prev.map(instance => 
          instance.id === instanceId 
            ? {...instance, qrCodeUrl: mockQrCodeUrl} 
            : instance
        )
      );
      
      setShowQrCode(instanceId);
      toast.success("QR Code atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar QR Code. Tente novamente.");
      console.error(error);
    } finally {
      setIsLoading({...isLoading, [instanceId]: false});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-xl font-semibold">Gerenciamento de WhatsApp</h3>
        <p className="text-sm text-muted-foreground">
          Conecte e gerencie suas instâncias de WhatsApp
        </p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {instances.map(instance => (
          <Card key={instance.id} className="overflow-hidden glass-card border-0">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-medium">WhatsApp</h4>
                    <p className="text-sm text-muted-foreground">Instância: {instanceName}</p>
                  </div>
                  <Badge variant="outline" className={instance.connected ? 
                    "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : 
                    "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"}>
                    {instance.connected ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
                
                {showQrCode === instance.id && instance.qrCodeUrl && (
                  <div className="flex justify-center mb-4 p-4 bg-white rounded-md">
                    <img 
                      src={instance.qrCodeUrl} 
                      alt="QR Code para conexão do WhatsApp" 
                      className="w-48 h-48"
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  {!instance.connected ? (
                    <>
                      <Button 
                        variant="whatsapp" 
                        className="flex-1"
                        onClick={() => handleConnect(instance.id)}
                        disabled={isLoading[instance.id]}
                      >
                        <Link className="w-4 h-4" />
                        {isLoading[instance.id] ? "Conectando..." : "Conectar WhatsApp"}
                      </Button>
                      
                      {instance.qrCodeUrl && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleRefreshQrCode(instance.id)}
                          disabled={isLoading[instance.id]}
                        >
                          <RefreshCw className="w-4 h-4" />
                          {isLoading[instance.id] ? "Gerando..." : "Gerar novo QR Code"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleDelete(instance.id)}
                      disabled={isLoading[instance.id]}
                    >
                      <Trash2 className="w-4 h-4" />
                      {isLoading[instance.id] ? "Desconectando..." : "Deletar WhatsApp"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Placeholder para adicional instância em planos superiores */}
        <Card className="overflow-hidden glass-card border-0 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
            <QrCode className="w-8 h-8 text-gray-400 mb-2" />
            <h4 className="font-medium">Adicional WhatsApp</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Disponível em planos superiores
            </p>
            <Button variant="outline" disabled>Upgrade de Plano</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
