
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Rocket, 
  TestTube, 
  Globe, 
  Settings, 
  History, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useDeployManager } from '@/hooks/deploy/useDeployManager';

export const DeployManager = () => {
  const [gitRepository, setGitRepository] = useState('https://github.com/seu-usuario/ticlin-crm.git');
  
  const {
    isDeployingTest,
    isDeployingProduction,
    testStatus,
    productionStatus,
    deployHistory,
    isSettingUpInfrastructure,
    deployToTest,
    deployToProduction,
    setupInfrastructure,
    refreshStatuses
  } = useDeployManager();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'deploying': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      deploying: 'secondary'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status === 'success' && 'Online'}
        {status === 'error' && 'Offline'}
        {status === 'deploying' && 'Deployando'}
        {!status && 'Desconhecido'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deploy Manager</h2>
          <p className="text-muted-foreground">
            Sistema de deploy automático para teste e produção
          </p>
        </div>
        <Button onClick={refreshStatuses} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="deploy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="setup">Configuração</TabsTrigger>
        </TabsList>

        {/* Tab de Deploy */}
        <TabsContent value="deploy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Configuração do Repositório
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="git-repo">URL do Repositório Git</Label>
                <Input
                  id="git-repo"
                  value={gitRepository}
                  onChange={(e) => setGitRepository(e.target.value)}
                  placeholder="https://github.com/seu-usuario/ticlin-crm.git"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ambientes de Deploy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ambiente de Teste */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-blue-500" />
                  Ambiente de Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>teste-crm.ticlin.com.br</span>
                  <a 
                    href="https://teste-crm.ticlin.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(testStatus?.status)}
                  {getStatusBadge(testStatus?.status)}
                </div>

                {testStatus?.lastDeploy && (
                  <p className="text-sm text-muted-foreground">
                    Último deploy: {new Date(testStatus.lastDeploy).toLocaleString()}
                  </p>
                )}

                <Button 
                  onClick={() => deployToTest(gitRepository)}
                  disabled={isDeployingTest || !gitRepository}
                  className="w-full"
                  variant="outline"
                >
                  {isDeployingTest ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Deployando...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      PUBLICAR TESTE
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Ambiente de Produção */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  Ambiente de Produção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>crm.ticlin.com.br</span>
                  <a 
                    href="https://crm.ticlin.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(productionStatus?.status)}
                  {getStatusBadge(productionStatus?.status)}
                </div>

                {productionStatus?.lastDeploy && (
                  <p className="text-sm text-muted-foreground">
                    Último deploy: {new Date(productionStatus.lastDeploy).toLocaleString()}
                  </p>
                )}

                <Button 
                  onClick={() => deployToProduction(gitRepository)}
                  disabled={isDeployingProduction || !gitRepository}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isDeployingProduction ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Deployando...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      PUBLICAR PRODUÇÃO
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Status */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status do Teste</CardTitle>
              </CardHeader>
              <CardContent>
                {testStatus ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testStatus.status)}
                      {getStatusBadge(testStatus.status)}
                    </div>
                    <p className="text-sm">Ambiente: teste-crm.ticlin.com.br</p>
                    {testStatus.lastDeploy && (
                      <p className="text-sm text-muted-foreground">
                        Último deploy: {new Date(testStatus.lastDeploy).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Carregando status...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status da Produção</CardTitle>
              </CardHeader>
              <CardContent>
                {productionStatus ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(productionStatus.status)}
                      {getStatusBadge(productionStatus.status)}
                    </div>
                    <p className="text-sm">Ambiente: crm.ticlin.com.br</p>
                    {productionStatus.lastDeploy && (
                      <p className="text-sm text-muted-foreground">
                        Último deploy: {new Date(productionStatus.lastDeploy).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Carregando status...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Histórico */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Deploys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {deployHistory.length > 0 ? (
                  <div className="space-y-4">
                    {deployHistory.map((deploy, index) => (
                      <div key={deploy.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deploy.status)}
                            <span className="font-medium">
                              {deploy.environment === 'test' ? 'Teste' : 'Produção'}
                            </span>
                            {getStatusBadge(deploy.status)}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(deploy.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Deploy ID: {deploy.id}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum deploy realizado ainda
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Configuração */}
        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração da Infraestrutura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Configure a infraestrutura base na VPS para suportar o sistema de deploy automático.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium">O que será configurado:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Nginx para servir os sites</li>
                  <li>• Estrutura de diretórios para teste e produção</li>
                  <li>• Certificados SSL automáticos</li>
                  <li>• Scripts de deploy</li>
                </ul>
              </div>

              <Separator />

              <Button 
                onClick={setupInfrastructure}
                disabled={isSettingUpInfrastructure}
                className="w-full"
              >
                {isSettingUpInfrastructure ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Infraestrutura
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
