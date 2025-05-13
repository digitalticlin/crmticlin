
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sliders, Shield, Database, Bot, 
  ServerCog, AlertTriangle, Save
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function ConfigPanel() {
  const [activeTab, setActiveTab] = useState("general");
  const [config, setConfig] = useState({
    systemName: "CRM Ticlin",
    apiUrl: "https://api.evolution.com",
    maxInstances: "200",
    maxUsers: "1000",
    debugMode: false,
    maintenanceMode: false,
    logRetention: "30",
    webhookUrl: "https://ticlin.com.br/api/webhook/evolution",
    aiModel: "gpt-4o",
    aiBotLimit: "100",
    termsText: "Termos e condições para uso da plataforma CRM Ticlin..."
  });
  
  // Create forms for different sections
  const generalForm = useForm({
    defaultValues: {
      systemName: config.systemName,
      maxInstances: config.maxInstances,
      maxUsers: config.maxUsers,
      logRetention: config.logRetention,
      debugMode: config.debugMode,
      maintenanceMode: config.maintenanceMode,
      termsText: config.termsText
    }
  });

  const integrationsForm = useForm({
    defaultValues: {
      apiUrl: config.apiUrl,
      webhookUrl: config.webhookUrl,
      aiModel: config.aiModel,
      aiBotLimit: config.aiBotLimit
    }
  });
  
  const handleConfigChange = (field: string, value: any) => {
    setConfig({
      ...config,
      [field]: value
    });
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Sliders className="h-5 w-5 mt-1" />
                <div>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>
                    Configure os parâmetros básicos da plataforma
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form {...generalForm}>
                  <div className="space-y-4">
                    <FormField
                      control={generalForm.control}
                      name="systemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Sistema</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="CRM Ticlin" 
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleConfigChange('systemName', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Nome exibido em emails e notificações
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="maxInstances"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limite Máximo de Instâncias WhatsApp</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleConfigChange('maxInstances', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Número máximo de instâncias WhatsApp permitidas no sistema
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="maxUsers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Limite Máximo de Usuários</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleConfigChange('maxUsers', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Número máximo de usuários permitidos no sistema
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="logRetention"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Retenção de Logs (dias)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleConfigChange('logRetention', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Período de retenção dos logs do sistema (em dias)
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
                
                <Form {...generalForm}>
                  <div className="space-y-4">
                    <FormField
                      control={generalForm.control}
                      name="debugMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Modo de Depuração</FormLabel>
                            <FormDescription>
                              Ativa logs e informações detalhadas para debugging
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                handleConfigChange('debugMode', checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="maintenanceMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Modo de Manutenção</FormLabel>
                            <FormDescription>
                              Bloqueia o acesso de usuários não-administradores
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch 
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                handleConfigChange('maintenanceMode', checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generalForm.control}
                      name="termsText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Termos de Uso e Política de Privacidade</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              className="min-h-[150px]"
                              onChange={(e) => {
                                field.onChange(e);
                                handleConfigChange('termsText', e.target.value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Texto exibido para os usuários durante o cadastro
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="ml-auto bg-[#d3d800] hover:bg-[#b8bc00]"
                onClick={() => generalForm.handleSubmit((data) => console.log("Form submitted:", data))()}
              >
                <Save className="h-4 w-4 mr-1" /> Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <Shield className="h-5 w-5 mt-1" />
                <div>
                  <CardTitle>Configurações de Segurança</CardTitle>
                  <CardDescription>
                    Configure os parâmetros de segurança da plataforma
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Configurações de segurança serão implementadas aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <ServerCog className="h-5 w-5 mt-1" />
                <div>
                  <CardTitle>Integrações</CardTitle>
                  <CardDescription>
                    Configure as integrações com serviços externos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b pb-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Database className="h-5 w-5 mr-2" /> Integração Evolution API
                </h3>
                <Form {...integrationsForm}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={integrationsForm.control}
                        name="apiUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL da API</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://api.evolution.com"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleConfigChange('apiUrl', e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Endereço da Evolution API para comunicação
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={integrationsForm.control}
                        name="webhookUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Webhook</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://ticlin.com.br/api/webhook/evolution"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleConfigChange('webhookUrl', e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              URL para recebimento de eventos da Evolution API
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                        <span>Status da Integração</span>
                      </div>
                      <span className="text-sm text-green-600">Conectado e Operacional</span>
                    </div>
                  </div>
                </Form>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Bot className="h-5 w-5 mr-2" /> Configurações de IA
                </h3>
                <Form {...integrationsForm}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={integrationsForm.control}
                        name="aiModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modelo de IA</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="gpt-4o"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleConfigChange('aiModel', e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Modelo utilizado para agentes de IA
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={integrationsForm.control}
                        name="aiBotLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Limite de Agentes IA</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="100"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleConfigChange('aiBotLimit', e.target.value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Limite máximo de agentes IA simultâneos no sistema
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-yellow-700">Aviso</span>
                      </div>
                      <span className="text-sm text-yellow-700">Alto uso de recursos (85% do limite)</span>
                    </div>
                  </div>
                </Form>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="mr-auto">
                Testar Conexões
              </Button>
              <Button 
                className="bg-[#d3d800] hover:bg-[#b8bc00]"
                onClick={() => integrationsForm.handleSubmit((data) => console.log("Integrations form submitted:", data))()}
              >
                <Save className="h-4 w-4 mr-1" /> Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
