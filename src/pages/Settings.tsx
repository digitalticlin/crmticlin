
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Bell, 
  CreditCard, 
  Moon,
  Sun, 
  Bot, 
  Shield 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/use-theme";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    app: true,
    marketing: false,
    security: true,
    whatsapp: false
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações da sua conta e preferências</p>
          </div>
          
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid grid-cols-5 h-auto p-1 bg-white/10 dark:bg-black/10 backdrop-blur-lg rounded-xl">
              <TabsTrigger value="profile" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
                <User className="h-4 w-4 mr-2" /> 
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
                <Bell className="h-4 w-4 mr-2" /> 
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
                <Sun className="h-4 w-4 mr-2" /> 
                <span className="hidden sm:inline">Aparência</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
                <Bot className="h-4 w-4 mr-2" /> 
                <span className="hidden sm:inline">IA</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-lg py-2">
                <CreditCard className="h-4 w-4 mr-2" /> 
                <span className="hidden sm:inline">Faturamento</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Perfil</CardTitle>
                  <CardDescription>
                    Gerencie suas informações de perfil e dados da conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-ticlin/20 text-black text-2xl">
                        A
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Alterar foto
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        Remover
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input id="name" defaultValue="Admin User" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue="admin@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <Input id="company" defaultValue="Ticlin CRM" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Cargo</Label>
                      <Input id="position" defaultValue="Administrador" />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Segurança da Conta</h3>
                    <div className="space-y-2">
                      <Button variant="outline">Alterar senha</Button>
                      <p className="text-sm text-muted-foreground">
                        Última alteração de senha: 15/03/2024
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Autenticação de dois fatores</Label>
                        <p className="text-sm text-muted-foreground">
                          Adicione uma camada extra de segurança à sua conta
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Notificações</CardTitle>
                  <CardDescription>
                    Configure como e quando você deseja receber atualizações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Preferências de Notificação</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notificações por Email</Label>
                          <p className="text-sm text-muted-foreground">
                            Receba atualizações importantes por email
                          </p>
                        </div>
                        <Switch 
                          checked={notifications.email} 
                          onCheckedChange={(checked) => setNotifications({...notifications, email: checked})} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Notificações no Aplicativo</Label>
                          <p className="text-sm text-muted-foreground">
                            Receba alertas dentro da plataforma Ticlin
                          </p>
                        </div>
                        <Switch 
                          checked={notifications.app} 
                          onCheckedChange={(checked) => setNotifications({...notifications, app: checked})} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Alertas de Segurança</Label>
                          <p className="text-sm text-muted-foreground">
                            Receba alertas sobre atividades suspeitas ou login de novos dispositivos
                          </p>
                        </div>
                        <Switch 
                          checked={notifications.security} 
                          onCheckedChange={(checked) => setNotifications({...notifications, security: checked})} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Mensagens de WhatsApp</Label>
                          <p className="text-sm text-muted-foreground">
                            Receba notificações de novas mensagens de WhatsApp
                          </p>
                        </div>
                        <Switch 
                          checked={notifications.whatsapp} 
                          onCheckedChange={(checked) => setNotifications({...notifications, whatsapp: checked})} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Comunicações de Marketing</Label>
                          <p className="text-sm text-muted-foreground">
                            Receba dicas, atualizações de produto e ofertas especiais
                          </p>
                        </div>
                        <Switch 
                          checked={notifications.marketing} 
                          onCheckedChange={(checked) => setNotifications({...notifications, marketing: checked})} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
                      Salvar Preferências
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="space-y-4">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Aparência</CardTitle>
                  <CardDescription>
                    Personalize a aparência da sua interface Ticlin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Tema</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div 
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 ${theme === "light" ? "border-ticlin" : "border-transparent"}`}
                        onClick={() => setTheme("light")}
                      >
                        <div className="h-20 w-full rounded-lg bg-white flex flex-col items-end p-2">
                          <div className="w-6 h-6 rounded-full bg-black/10"></div>
                          <div className="flex-grow"></div>
                          <div className="w-full h-2 rounded-full bg-black/10"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <span>Claro</span>
                        </div>
                      </div>
                      
                      <div 
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 ${theme === "dark" ? "border-ticlin" : "border-transparent"}`}
                        onClick={() => setTheme("dark")}
                      >
                        <div className="h-20 w-full rounded-lg bg-gray-800 flex flex-col items-end p-2">
                          <div className="w-6 h-6 rounded-full bg-white/10"></div>
                          <div className="flex-grow"></div>
                          <div className="w-full h-2 rounded-full bg-white/10"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <span>Escuro</span>
                        </div>
                      </div>
                      
                      <div 
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer border-2 ${theme === "system" ? "border-ticlin" : "border-transparent"}`}
                        onClick={() => setTheme("system")}
                      >
                        <div className="h-20 w-full rounded-lg bg-gradient-to-r from-white to-gray-800 flex flex-col items-end p-2">
                          <div className="w-6 h-6 rounded-full bg-black/10"></div>
                          <div className="flex-grow"></div>
                          <div className="w-full h-2 rounded-full bg-black/10"></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Sistema</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Outras Configurações</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Animações</Label>
                        <p className="text-sm text-muted-foreground">
                          Ativar ou desativar animações da interface
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Efeitos Glassmorphism</Label>
                        <p className="text-sm text-muted-foreground">
                          Ativar ou desativar efeitos de transparência
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Restaurar Padrão</Button>
                    <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
                      Salvar Preferências
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ai" className="space-y-4">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Configurações de IA</CardTitle>
                  <CardDescription>
                    Configure e personalize as integrações de IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Agentes de IA</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure os agentes de IA para atendimento automático
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-ticlin/10 text-black">
                      3 de 3 disponíveis
                    </Badge>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Bot className="h-4 w-4 mr-2" />
                    Gerenciar Agentes de IA
                  </Button>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Preferências de Automação</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Resposta Automática</Label>
                        <p className="text-sm text-muted-foreground">
                          Permitir que agentes de IA respondam automaticamente aos clientes
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Movimentação Automática de Funil</Label>
                        <p className="text-sm text-muted-foreground">
                          Permitir que agentes de IA movam cards no funil Kanban
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sugestões de IA</Label>
                        <p className="text-sm text-muted-foreground">
                          Exibir sugestões de respostas e ações baseadas em IA
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancelar</Button>
                    <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
                      Salvar Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="billing" className="space-y-4">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle>Faturamento e Assinatura</CardTitle>
                  <CardDescription>
                    Gerencie sua assinatura, método de pagamento e faturamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Plano Atual</Label>
                    <div className="p-4 rounded-lg bg-white/10 dark:bg-black/10 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Plano Pro</h3>
                        <p className="text-sm text-muted-foreground">
                          Faturamento mensal - Próximo pagamento em 15/06/2024
                        </p>
                      </div>
                      <Badge className="bg-ticlin text-black">R$199/mês</Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button variant="outline" className="text-xs h-8">
                        Alterar Plano
                      </Button>
                      <Button variant="outline" className="text-xs h-8">
                        Cancelar Assinatura
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Método de Pagamento</Label>
                    <div className="p-4 rounded-lg bg-white/10 dark:bg-black/10 flex justify-between items-center">
                      <div className="flex items-center">
                        <CreditCard className="h-8 w-8 mr-4" />
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-muted-foreground">Expira em 06/2025</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Histórico de Faturas</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                            <th className="pb-2 font-medium">Data</th>
                            <th className="pb-2 font-medium">Descrição</th>
                            <th className="pb-2 font-medium">Valor</th>
                            <th className="pb-2 font-medium">Status</th>
                            <th className="pb-2 font-medium text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 text-sm">15/05/2024</td>
                            <td className="py-2 text-sm">Assinatura Ticlin Pro - Mensal</td>
                            <td className="py-2 text-sm">R$199,00</td>
                            <td className="py-2 text-sm">
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                                Pago
                              </Badge>
                            </td>
                            <td className="py-2 text-sm text-right">
                              <Button variant="ghost" size="sm" className="h-7">
                                Baixar
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 text-sm">15/04/2024</td>
                            <td className="py-2 text-sm">Assinatura Ticlin Pro - Mensal</td>
                            <td className="py-2 text-sm">R$199,00</td>
                            <td className="py-2 text-sm">
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                                Pago
                              </Badge>
                            </td>
                            <td className="py-2 text-sm text-right">
                              <Button variant="ghost" size="sm" className="h-7">
                                Baixar
                              </Button>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 text-sm">15/03/2024</td>
                            <td className="py-2 text-sm">Assinatura Ticlin Pro - Mensal</td>
                            <td className="py-2 text-sm">R$199,00</td>
                            <td className="py-2 text-sm">
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                                Pago
                              </Badge>
                            </td>
                            <td className="py-2 text-sm text-right">
                              <Button variant="ghost" size="sm" className="h-7">
                                Baixar
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
