
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Globe, CheckCircle, AlertCircle, RefreshCw, Settings, Users } from 'lucide-react';
import { toast } from 'sonner';

export const GlobalWebhookManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);
  const [syncResults, setSyncResults] = useState<any>(null);

  const configureGlobalWebhook = async () => {
    setIsLoading(true);
    try {
      console.log('[Global Webhook Manager] 🌐 Configurando webhook global...');

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'configure_global_webhook'
        }
      });

      if (error) {
        console.error('[Global Webhook Manager] ❌ Erro:', error);
        throw error;
      }

      console.log('[Global Webhook Manager] ✅ Resposta:', data);

      if (data.success) {
        toast.success('Webhook global configurado com sucesso!');
        setWebhookStatus(data);
        await checkWebhookStatus(); // Verificar status após configurar
      } else {
        toast.error('Falha na configuração: ' + data.error);
      }
    } catch (error: any) {
      console.error('[Global Webhook Manager] 💥 Erro:', error);
      toast.error('Erro ao configurar webhook global: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkWebhookStatus = async () => {
    try {
      console.log('[Global Webhook Manager] 🔍 Verificando status...');

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'check_global_webhook_status'
        }
      });

      if (error) {
        console.error('[Global Webhook Manager] ❌ Erro no status:', error);
        throw error;
      }

      console.log('[Global Webhook Manager] 📊 Status:', data);
      setWebhookStatus(data);

      if (data.success) {
        toast.success('Status verificado com sucesso');
      } else {
        toast.warning('Problema no webhook: ' + data.error);
      }
    } catch (error: any) {
      console.error('[Global Webhook Manager] 💥 Erro no status:', error);
      toast.error('Erro ao verificar status: ' + error.message);
    }
  };

  const executeMultiTenantSync = async () => {
    setIsLoading(true);
    try {
      console.log('[Global Webhook Manager] 🏢 Executando sincronização multi-tenant...');

      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'execute_multi_tenant_sync'
        }
      });

      if (error) {
        console.error('[Global Webhook Manager] ❌ Erro na sync:', error);
        throw error;
      }

      console.log('[Global Webhook Manager] 🔄 Resultado da sync:', data);
      setSyncResults(data.result);

      if (data.success) {
        toast.success('Sincronização multi-tenant executada com sucesso!');
      } else {
        toast.error('Falha na sincronização: ' + data.error);
      }
    } catch (error: any) {
      console.error('[Global Webhook Manager] 💥 Erro na sync:', error);
      toast.error('Erro na sincronização: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Gerenciador de Webhook Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={configureGlobalWebhook}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Webhook Global
                  </>
                )}
              </Button>
              
              <Button 
                onClick={checkWebhookStatus}
                variant="outline"
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verificar Status
              </Button>
            </div>

            {webhookStatus && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Status do Webhook:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={webhookStatus.success ? 'default' : 'destructive'}>
                      {webhookStatus.success ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {webhookStatus.webhookUrl && (
                      <span className="text-sm text-muted-foreground">
                        {webhookStatus.webhookUrl}
                      </span>
                    )}
                  </div>
                  {webhookStatus.globalConfigId && (
                    <p className="text-sm">ID: {webhookStatus.globalConfigId}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Sincronização Multi-Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={executeMultiTenantSync}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Executar Sincronização Multi-Tenant
                </>
              )}
            </Button>

            {syncResults && (
              <div className="mt-4 p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Resultados da Sincronização:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {syncResults.companies && (
                    <div>
                      <p className="font-medium">Empresas:</p>
                      <p>Total: {syncResults.companies.totalCompanies}</p>
                      <p>Com usuários: {syncResults.companies.companiesWithUsers}</p>
                      <p>Com admin: {syncResults.companies.companiesWithAdmin}</p>
                    </div>
                  )}
                  {syncResults.instances && (
                    <div>
                      <p className="font-medium">Instâncias:</p>
                      <p>Total: {syncResults.instances.total}</p>
                      <p>Conectadas: {syncResults.instances.connected}</p>
                      <p>Órfãs: {syncResults.instances.orphans}</p>
                    </div>
                  )}
                  {syncResults.orphanSync && (
                    <div>
                      <p className="font-medium">Sync Órfãs:</p>
                      <p>Encontradas: {syncResults.orphanSync.orphansFound}</p>
                      <p>Sincronizadas: {syncResults.orphanSync.synced}</p>
                    </div>
                  )}
                  {syncResults.messages && (
                    <div>
                      <p className="font-medium">Mensagens:</p>
                      <p>Amostra: {syncResults.messages.totalSampled}</p>
                      <p>Órfãs: {syncResults.messages.orphanMessages}</p>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Tempo: {syncResults.executionTime}ms | {syncResults.timestamp}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium mb-2">ℹ️ Como funciona:</h4>
        <ul className="space-y-1">
          <li>• <strong>Webhook Global:</strong> Configura uma URL única para receber mensagens de TODAS as instâncias</li>
          <li>• <strong>Multi-Tenant:</strong> Separa mensagens por empresa usando o company_id</li>
          <li>• <strong>Auto-Configuração:</strong> Novas instâncias herdam automaticamente o webhook global</li>
          <li>• <strong>RLS:</strong> Garante que cada empresa veja apenas suas próprias mensagens</li>
        </ul>
      </div>
    </div>
  );
};
