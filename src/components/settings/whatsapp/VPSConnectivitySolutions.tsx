
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cloud, 
  Server, 
  Shield, 
  Zap, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Globe,
  Lock,
  Wifi,
  AlertTriangle,
  Settings,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ConnectivityStrategy {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'available' | 'configured' | 'testing' | 'active';
  difficulty: 'easy' | 'medium' | 'hard';
  benefits: string[];
  requirements: string[];
}

export const VPSConnectivitySolutions = () => {
  const [activeStrategy, setActiveStrategy] = useState<string>('cloudflare');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const strategies: ConnectivityStrategy[] = [
    {
      id: 'cloudflare',
      name: 'CloudFlare Tunnel',
      description: 'Proxy reverso gratuito com SSL automático e proteção DDoS',
      icon: Cloud,
      status: 'available',
      difficulty: 'easy',
      benefits: [
        'Gratuito e fácil de configurar',
        'SSL/TLS automático',
        'Proteção DDoS incluída',
        'Zero configuração de rede'
      ],
      requirements: [
        'Conta CloudFlare (gratuita)',
        'Instalar cloudflared na VPS',
        'Configurar túnel'
      ]
    },
    {
      id: 'nginx-proxy',
      name: 'Nginx Proxy',
      description: 'Servidor proxy dedicado com controle total',
      icon: Server,
      status: 'available',
      difficulty: 'medium',
      benefits: [
        'Controle total da configuração',
        'Performance otimizada',
        'Logs detalhados',
        'Load balancing'
      ],
      requirements: [
        'Servidor adicional ou subdomínio',
        'Certificado SSL',
        'Configuração manual do Nginx'
      ]
    },
    {
      id: 'ssh-tunnel',
      name: 'SSH Reverse Tunnel',
      description: 'Túnel SSH reverso para conectividade direta',
      icon: Shield,
      status: 'available',
      difficulty: 'hard',
      benefits: [
        'Conexão criptografada',
        'Sem dependências externas',
        'Controle total',
        'Debugging avançado'
      ],
      requirements: [
        'Configuração SSH avançada',
        'Servidor intermediário',
        'Gerenciamento de chaves'
      ]
    },
    {
      id: 'webhook-reverse',
      name: 'Webhook Inverso',
      description: 'VPS inicia conexões para o Supabase (pull-based)',
      icon: Zap,
      status: 'available',
      difficulty: 'medium',
      benefits: [
        'Sem problemas de firewall',
        'VPS controla timing',
        'Implementação simples',
        'Menos dependências'
      ],
      requirements: [
        'Refatorar arquitetura',
        'Sistema de filas',
        'Webhook endpoints'
      ]
    }
  ];

  const [configurations, setConfigurations] = useState({
    cloudflare: {
      domain: '',
      tunnelToken: '',
      configured: false
    },
    nginx: {
      proxyUrl: '',
      sslCert: '',
      configured: false
    },
    ssh: {
      jumpHost: '',
      privateKey: '',
      configured: false
    },
    webhook: {
      pollInterval: '5000',
      queueSystem: 'memory',
      configured: false
    }
  });

  const getDifficultyBadge = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      hard: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[difficulty as keyof typeof colors]}>
        {difficulty.toUpperCase()}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'configured':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleConfigureStrategy = async (strategyId: string) => {
    setIsConfiguring(true);
    
    try {
      // Simular configuração (aqui você integraria com as edge functions reais)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConfigurations(prev => ({
        ...prev,
        [strategyId]: { ...prev[strategyId as keyof typeof prev], configured: true }
      }));
      
      toast.success(`Estratégia ${strategyId} configurada com sucesso!`);
    } catch (error) {
      toast.error('Erro ao configurar estratégia');
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleTestStrategy = async (strategyId: string) => {
    try {
      // Simular teste (aqui você chamaria a edge function de diagnóstico com a nova URL)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResult = {
        success: Math.random() > 0.3,
        latency: Math.floor(Math.random() * 200) + 50,
        details: 'Teste de conectividade executado'
      };
      
      setTestResults(prev => ({ ...prev, [strategyId]: mockResult }));
      
      if (mockResult.success) {
        toast.success(`Estratégia ${strategyId} funcionando! Latência: ${mockResult.latency}ms`);
      } else {
        toast.error(`Falha no teste da estratégia ${strategyId}`);
      }
    } catch (error) {
      toast.error('Erro ao testar estratégia');
    }
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-blue-600" />
          Soluções de Conectividade VPS
        </CardTitle>
        <p className="text-sm text-gray-600">
          Estratégias avançadas para resolver problemas de conectividade entre Supabase e VPS
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeStrategy} onValueChange={setActiveStrategy} className="space-y-6">
          {/* Lista de Estratégias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strategy) => {
              const Icon = strategy.icon;
              const isSelected = activeStrategy === strategy.id;
              
              return (
                <Card 
                  key={strategy.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50/30' 
                      : 'hover:bg-gray-50/50'
                  }`}
                  onClick={() => setActiveStrategy(strategy.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium">{strategy.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(strategy.status)}
                        {getDifficultyBadge(strategy.difficulty)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {strategy.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-xs font-medium text-green-700 mb-1">Benefícios:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {strategy.benefits.slice(0, 2).map((benefit, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Configuração da Estratégia Selecionada */}
          <TabsList className="grid w-full grid-cols-4">
            {strategies.map((strategy) => (
              <TabsTrigger key={strategy.id} value={strategy.id}>
                {strategy.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* CloudFlare Configuration */}
          <TabsContent value="cloudflare" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Configurar CloudFlare Tunnel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cf-domain">Domínio Público</Label>
                    <Input
                      id="cf-domain"
                      placeholder="whatsapp-api.seudominio.com"
                      value={configurations.cloudflare.domain}
                      onChange={(e) => setConfigurations(prev => ({
                        ...prev,
                        cloudflare: { ...prev.cloudflare, domain: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cf-token">Token do Túnel</Label>
                    <Input
                      id="cf-token"
                      placeholder="eyJ..."
                      type="password"
                      value={configurations.cloudflare.tunnelToken}
                      onChange={(e) => setConfigurations(prev => ({
                        ...prev,
                        cloudflare: { ...prev.cloudflare, tunnelToken: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleConfigureStrategy('cloudflare')}
                    disabled={isConfiguring || !configurations.cloudflare.domain}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isConfiguring ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </>
                    )}
                  </Button>
                  
                  {configurations.cloudflare.configured && (
                    <Button 
                      variant="outline"
                      onClick={() => handleTestStrategy('cloudflare')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </Button>
                  )}
                </div>

                {testResults.cloudflare && (
                  <Card className={`border-l-4 ${testResults.cloudflare.success ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        {testResults.cloudflare.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">
                          {testResults.cloudflare.success ? 'Conectividade OK' : 'Falha na Conexão'}
                        </span>
                        {testResults.cloudflare.success && (
                          <Badge variant="outline">
                            {testResults.cloudflare.latency}ms
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nginx Proxy Configuration */}
          <TabsContent value="nginx-proxy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Configurar Nginx Proxy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nginx-url">URL do Proxy</Label>
                    <Input
                      id="nginx-url"
                      placeholder="https://proxy.seudominio.com"
                      value={configurations.nginx.proxyUrl}
                      onChange={(e) => setConfigurations(prev => ({
                        ...prev,
                        nginx: { ...prev.nginx, proxyUrl: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nginx-ssl">Certificado SSL</Label>
                    <Input
                      id="nginx-ssl"
                      placeholder="Caminho para o certificado"
                      value={configurations.nginx.sslCert}
                      onChange={(e) => setConfigurations(prev => ({
                        ...prev,
                        nginx: { ...prev.nginx, sslCert: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleConfigureStrategy('nginx-proxy')}
                  disabled={isConfiguring || !configurations.nginx.proxyUrl}
                  variant="outline"
                >
                  <Server className="h-4 w-4 mr-2" />
                  Configurar Proxy
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SSH Tunnel Configuration */}
          <TabsContent value="ssh-tunnel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configurar SSH Tunnel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Configuração Avançada</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Requer conhecimento técnico avançado de SSH e redes
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ssh-host">Servidor Intermediário</Label>
                    <Input
                      id="ssh-host"
                      placeholder="jumphost.exemplo.com"
                      value={configurations.ssh.jumpHost}
                      onChange={(e) => setConfigurations(prev => ({
                        ...prev,
                        ssh: { ...prev.ssh, jumpHost: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssh-key">Chave Privada</Label>
                    <Input
                      id="ssh-key"
                      placeholder="-----BEGIN PRIVATE KEY-----"
                      type="password"
                      value={configurations.ssh.privateKey}
                      onChange={(e) => setConfigurations(prev => ({
                        ...prev,
                        ssh: { ...prev.ssh, privateKey: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleConfigureStrategy('ssh-tunnel')}
                  disabled={isConfiguring}
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Configurar Túnel
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook Reverse Configuration */}
          <TabsContent value="webhook-reverse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Configurar Webhook Inverso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-800">
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-sm font-medium">Mudança Arquitetural</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    VPS fará polling para o Supabase ao invés de receber chamadas
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="poll-interval">Intervalo de Polling (ms)</Label>
                    <Input
                      id="poll-interval"
                      placeholder="5000"
                      value={configurations.webhook.pollInterval}
                      onChange={(e) => setConfigurations(prev => ({
                        ...prev,
                        webhook: { ...prev.webhook, pollInterval: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="queue-system">Sistema de Filas</Label>
                    <Input
                      id="queue-system"
                      placeholder="redis/memory"
                      value={configurations.webhook.queueSystem}
                      onChange={(e) => setConfigurations(prev => ({
                        ...prev,
                        webhook: { ...prev.webhook, queueSystem: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleConfigureStrategy('webhook-reverse')}
                  disabled={isConfiguring}
                  variant="outline"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Configurar Webhooks
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
