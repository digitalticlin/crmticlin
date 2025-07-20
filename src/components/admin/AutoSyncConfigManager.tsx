
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, RefreshCcw } from "lucide-react";

interface AutoSyncConfig {
  enabled: boolean;
  interval: number;
  healthCheckInterval: number;
  maxRetries: number;
  webhook: {
    enabled: boolean;
    url: string;
    events: string[];
  };
}

export const AutoSyncConfigManager = () => {
  const [config, setConfig] = useState<AutoSyncConfig>({
    enabled: true,
    interval: 180000, // 3 minutos
    healthCheckInterval: 120000, // 2 minutos
    maxRetries: 3,
    webhook: {
      enabled: true,
      url: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web',
      events: ['qr.update', 'messages.upsert', 'connection.update']
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // Simular salvamento da configuração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('whatsapp_auto_sync_config', JSON.stringify(config));
      setLastSaved(new Date());
      toast.success('Configuração salva com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadConfig = () => {
    try {
      const savedConfig = localStorage.getItem('whatsapp_auto_sync_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
        toast.success('Configuração carregada');
      } else {
        toast.info('Nenhuma configuração salva encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração');
    }
  };

  useEffect(() => {
    handleLoadConfig();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Configuração de Auto-Sync
          </div>
          <div className="flex items-center gap-2">
            {config.enabled && (
              <Badge className="bg-green-100 text-green-800">
                Ativo
              </Badge>
            )}
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Salvo: {lastSaved.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configurações Gerais */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Configurações Gerais</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sync-enabled">Auto-Sync Habilitado</Label>
            <Switch
              id="sync-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sync-interval">Intervalo de Sync (ms)</Label>
              <Input
                id="sync-interval"
                type="number"
                value={config.interval}
                onChange={(e) => 
                  setConfig(prev => ({ ...prev, interval: parseInt(e.target.value) || 180000 }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Atual: {Math.round(config.interval / 1000)}s
              </p>
            </div>

            <div>
              <Label htmlFor="health-interval">Health Check (ms)</Label>
              <Input
                id="health-interval"
                type="number"
                value={config.healthCheckInterval}
                onChange={(e) => 
                  setConfig(prev => ({ ...prev, healthCheckInterval: parseInt(e.target.value) || 120000 }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Atual: {Math.round(config.healthCheckInterval / 1000)}s
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="max-retries">Máximo de Tentativas</Label>
            <Input
              id="max-retries"
              type="number"
              min="1"
              max="10"
              value={config.maxRetries}
              onChange={(e) => 
                setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 3 }))
              }
            />
          </div>
        </div>

        {/* Configurações de Webhook */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium text-sm">Configurações de Webhook</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="webhook-enabled">Webhook Habilitado</Label>
            <Switch
              id="webhook-enabled"
              checked={config.webhook.enabled}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ 
                  ...prev, 
                  webhook: { ...prev.webhook, enabled: checked }
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <Input
              id="webhook-url"
              value={config.webhook.url}
              onChange={(e) => 
                setConfig(prev => ({ 
                  ...prev, 
                  webhook: { ...prev.webhook, url: e.target.value }
                }))
              }
              placeholder="https://..."
            />
          </div>

          <div>
            <Label>Eventos Monitorados</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {config.webhook.events.map((event, index) => (
                <Badge key={index} variant="secondary">
                  {event}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>

          <Button
            onClick={handleLoadConfig}
            variant="outline"
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Recarregar
          </Button>
        </div>

        {/* Informações */}
        <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
          <p><strong>Nota:</strong> As configurações são salvas localmente no navegador.</p>
          <p>• Intervalo menor = mais atualizações, mas maior uso de recursos</p>
          <p>• Health Check monitora a saúde das conexões</p>
          <p>• Webhook recebe eventos em tempo real da VPS</p>
        </div>
      </CardContent>
    </Card>
  );
};
