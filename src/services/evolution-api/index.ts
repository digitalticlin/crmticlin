
import { ApiClient } from "./api-client";
import { InstanceService } from "./instance-service";
import { ChatService } from "./chat-service";

// URL da API e chave são carregados de variáveis de ambiente ou valores padrão
const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL || "https://ticlin-evolution-api.eirfpl.easypanel.host";
const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY || "your-api-key";

// Criar cliente API e serviços
const apiClient = new ApiClient(apiUrl, apiKey);
const instanceService = new InstanceService(apiClient);
const chatService = new ChatService(apiClient);

// Exportar serviço Evolution API com métodos simplificados
export const evolutionApiService = {
  // Métodos de gerenciamento de instâncias
  fetchInstances: () => instanceService.fetchInstances(),
  createInstance: (instanceName: string) => instanceService.createInstance(instanceName),
  deleteInstance: (instanceName: string) => instanceService.deleteInstance(instanceName),
  refreshQrCode: (instanceName: string) => instanceService.refreshQrCode(instanceName),
  checkInstanceStatus: (instanceName: string) => instanceService.checkInstanceStatus(instanceName),
  connectInstance: (instanceName: string) => instanceService.connectInstance(instanceName),
  
  // Métodos de chat e mensagens
  fetchContacts: (instanceName: string) => chatService.fetchContacts(instanceName),
  fetchMessages: (instanceName: string, phone: string) => chatService.fetchMessages(instanceName, phone),
  sendMessage: (instanceName: string, to: string, message: string) => chatService.sendMessage(instanceName, to, message),
  sendMediaMessage: (instanceName: string, to: string, mediaUrl: string, caption: string, mediaType: string) => 
    chatService.sendMediaMessage(instanceName, to, mediaUrl, caption, mediaType)
};
