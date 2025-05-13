
import { useState } from "react";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, Bell, Send, 
  ChevronDown, Link, Upload 
} from "lucide-react";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

// Mock data for support tickets
const mockTickets = [
  {
    id: "1",
    company: "Tech Solutions Ltda",
    subject: "Problemas com conexão WhatsApp",
    status: "open",
    priority: "high",
    created: "2024-05-13 10:23",
    lastUpdate: "2024-05-13 14:45",
    messages: 3
  },
  {
    id: "2",
    company: "Marketing Digital SA",
    subject: "Dificuldades com importação de contatos",
    status: "pending",
    priority: "medium",
    created: "2024-05-12 15:17",
    lastUpdate: "2024-05-13 09:30",
    messages: 5
  },
  {
    id: "3",
    company: "Comércio Eletrônico Brasil",
    subject: "Solicito mudança de plano",
    status: "closed",
    priority: "low",
    created: "2024-05-10 11:42",
    lastUpdate: "2024-05-11 16:20",
    messages: 2
  }
];

export default function SupportPanel() {
  const [tickets] = useState(mockTickets);
  const [activeTab, setActiveTab] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  
  const handleSelectTicket = (ticket: any) => {
    setSelectedTicket(ticket);
  };
  
  const sendMessage = () => {
    if (messageText.trim()) {
      // In a real implementation, this would send the message to the API
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "open":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Aberto</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolvido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case "high":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Alta</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Média</Badge>;
      case "low":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Baixa</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Tickets de Suporte</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tickets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Tickets Ativos</CardTitle>
                <CardDescription>
                  Lista de tickets de suporte das empresas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id ? 'bg-gray-100 dark:bg-gray-800 border-[#d3d800]' : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                      onClick={() => handleSelectTicket(ticket)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm">{ticket.subject}</h3>
                        {ticket.status === 'open' && (
                          <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{ticket.company}</div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-2">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3 inline mr-1" /> 
                          {ticket.messages}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Ver Todos os Tickets</Button>
              </CardFooter>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                {selectedTicket ? (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedTicket.subject}</CardTitle>
                        <CardDescription className="mt-1">
                          {selectedTicket.company} • Criado em {selectedTicket.created}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(selectedTicket.status)}
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">Resolver</Button>
                      <Button variant="outline" size="sm">Atribuir</Button>
                      <Button variant="outline" size="sm" className="text-red-500">Fechar</Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <CardTitle>Nenhum ticket selecionado</CardTitle>
                    <CardDescription className="mt-1">
                      Selecione um ticket da lista para ver os detalhes
                    </CardDescription>
                  </div>
                )}
              </CardHeader>
              
              {selectedTicket && (
                <>
                  <CardContent className="border-t border-b min-h-[300px] max-h-[400px] overflow-y-auto">
                    <div className="py-6 px-2 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-800 font-medium">TS</span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">João Silva</span>
                              <span className="text-xs text-muted-foreground">2024-05-13 10:23</span>
                            </div>
                            <p>Estamos tendo problemas para conectar nosso número de WhatsApp. O QR code não está sendo gerado corretamente.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-[#d3d800]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#d3d800] font-medium">TC</span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-[#d3d800]/10 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">Suporte Ticlin</span>
                              <span className="text-xs text-muted-foreground">2024-05-13 11:45</span>
                            </div>
                            <p>Olá João, vamos verificar o problema com o QR code. Poderia nos informar qual é a versão do navegador que está utilizando?</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-800 font-medium">TS</span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">João Silva</span>
                              <span className="text-xs text-muted-foreground">2024-05-13 14:30</span>
                            </div>
                            <p>Estamos usando o Chrome versão 123.0.6312.86. Tentamos também no Firefox e o problema persiste.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-4">
                    <div className="w-full space-y-4">
                      <Textarea 
                        placeholder="Digite sua mensagem..." 
                        className="min-h-[100px]"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Link className="h-4 w-4 mr-1" /> Anexar URL
                          </Button>
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-1" /> Anexar Arquivo
                          </Button>
                        </div>
                        <Button 
                          className="bg-[#d3d800] hover:bg-[#b8bc00]"
                          onClick={sendMessage}
                          disabled={!messageText.trim()}
                        >
                          <Send className="h-4 w-4 mr-1" /> Enviar Resposta
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações aos Clientes</CardTitle>
              <CardDescription>
                Envie notificações para todas as empresas ou empresas específicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Destinatários</label>
                <div className="flex items-center border rounded-md p-2">
                  <span className="bg-[#d3d800]/20 text-[#d3d800] text-xs font-medium px-2 py-1 rounded mr-2">
                    Todas as Empresas
                  </span>
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Assunto</label>
                <input 
                  type="text"
                  className="w-full p-2 border rounded-md"
                  placeholder="Digite o assunto da notificação"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem</label>
                <Textarea 
                  placeholder="Digite sua mensagem para as empresas..."
                  className="min-h-[150px]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Opções de Entrega</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="email" className="mr-2" />
                    <label htmlFor="email">Enviar por Email</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="dashboard" className="mr-2" />
                    <label htmlFor="dashboard">Exibir no Dashboard</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="immediate" className="mr-2" />
                    <label htmlFor="immediate">Entrega Imediata</label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Visualizar</Button>
              <Button className="bg-[#d3d800] hover:bg-[#b8bc00]">
                <Bell className="h-4 w-4 mr-1" /> Enviar Notificação
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
